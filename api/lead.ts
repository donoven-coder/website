// POST /api/lead: saves a qualifier submission to Notion and posts a Slack alert and an email.
// The page sends this in the background and never waits on it, so failures here only affect
// record-keeping; a failed Notion write still reaches Slack and email with every detail, and
// likely bots go to Slack flagged instead of being dropped. Every early return logs a one-line reason.
import { clientIp, env, json, originAllowed, rateLimited, readBody } from "./_lib/http.js";
import { cancelScheduledEmail, sendAlertEmail, sendLeadEmail, sendSlack, slackEscape, slackLink } from "./_lib/alerts.js";
import { bookingLink, followUp1 } from "./_lib/followups.js";
import { CONSENT_OPTED_IN, createLead, findLeadBy, PROPS, prop, SOURCE, STATUS } from "./_lib/notion.js";
import { fitFor, isBudget, isEmail, isPhone, isTrade, LIMITS } from "../src/lib/qualifier.js";
import { formatET } from "../src/lib/time.js";

type LeadInput = {
  lead_id: string; trade: string; ad_budget: string; business: string; phone: string; goal: string; email: string;
  utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string; fbclid: string;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function validate(body: Record<string, unknown>): { lead?: LeadInput; error?: string } {
  const lead: LeadInput = {
    lead_id: str(body.lead_id, 64),
    trade: str(body.trade, 80),
    ad_budget: str(body.ad_budget, 40),
    business: str(body.business, LIMITS.business),
    phone: str(body.phone, LIMITS.phone),
    goal: str(body.goal, LIMITS.goal),
    email: str(body.email, LIMITS.email),
    utm_source: str(body.utm_source, 200),
    utm_medium: str(body.utm_medium, 200),
    utm_campaign: str(body.utm_campaign, 200),
    utm_content: str(body.utm_content, 200),
    fbclid: str(body.fbclid, 200),
  };
  if (!/^[\w-]{8,64}$/.test(lead.lead_id)) return { error: "lead_id" };
  if (!isTrade(lead.trade)) return { error: "trade" };
  if (!isBudget(lead.ad_budget)) return { error: "ad_budget" };
  if (!lead.business) return { error: "business" };
  if (!isPhone(lead.phone)) return { error: "phone" };
  // Optional for the server (a page opened before the field existed sends none: no follow-ups then).
  if (lead.email && !isEmail(lead.email)) return { error: "email" };
  return { lead };
}

/** Faster than this from first touching the form to submitting is treated as a likely bot. */
const MIN_FORM_MS = 3000;

/** Follow-up 1 goes out this long after the form, unless they book first (the Cal webhook cancels it). */
const FOLLOW_UP_1_DELAY_MS = 60 * 60 * 1000;

/** One log line per early return: a reason only, never secrets or what the visitor typed. */
const reject = (reason: string, res: Response) => { console.warn(`[lead] rejected: ${reason}`); return res; };

/**
 * GET isn't supported, but the 405 names the deployed commit (Vercel's built-in, non-secret
 * VERCEL_GIT_COMMIT_SHA), so opening /api/lead in a browser shows which code is live.
 */
export function GET(): Response {
  const res = json({ ok: false, error: "method", build: env("VERCEL_GIT_COMMIT_SHA").slice(0, 7) || "unknown" }, 405);
  res.headers.set("Allow", "POST");
  return res;
}

export async function POST(request: Request): Promise<Response> {
  console.log(`[lead] env NOTION_TOKEN=${Boolean(env("NOTION_TOKEN"))} SLACK_WEBHOOK_URL=${Boolean(env("SLACK_WEBHOOK_URL"))}`);
  if (!originAllowed(request)) {
    return reject(`origin ${(request.headers.get("origin") ?? "none").slice(0, 100)}`, json({ ok: false, error: "origin" }, 403));
  }
  if (rateLimited(`lead:${clientIp(request)}`)) return reject("rate_limited", json({ ok: false, error: "rate_limited" }, 429));

  const raw = await readBody(request);
  if (raw === null) return reject("too_large", json({ ok: false, error: "too_large" }, 413));
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return reject("bad_json", json({ ok: false, error: "json" }, 400)); }

  const { lead, error } = validate(body);
  if (!lead) return reject(`invalid_${error}`, json({ ok: false, error: `invalid_${error}` }, 400));
  const fit = fitFor(lead.trade, lead.ad_budget); // recomputed here; the browser's value isn't trusted
  const summary = [lead.business, lead.trade, lead.ad_budget, lead.phone].map(slackEscape).join(" · ");

  // Likely bot: the hidden field was filled, or the form was submitted implausibly fast. It isn't
  // saved to Notion, but it still goes to Slack, so a false positive can never lose a real lead.
  const formMs = typeof body.form_ms === "number" && Number.isFinite(body.form_ms) ? body.form_ms : null;
  const botReason = typeof body.hp_ref === "string" && body.hp_ref.trim()
    ? "hidden field filled"
    : formMs !== null && formMs >= 0 && formMs < MIN_FORM_MS ? `submitted ${Math.round(formMs)}ms after first touch` : "";
  if (botReason) {
    console.warn(`[lead] possible bot: ${botReason}`);
    const slackOk = await sendSlack(`⚠️ Possible bot (${botReason}), not saved to Notion: ${summary} · Fit: ${fit}${lead.goal ? `\nGoal: ${slackEscape(lead.goal)}` : ""}`);
    console.log(`[lead] done notion=skipped slack=${slackOk}`);
    return json({ ok: true, pageId: null });
  }

  // Follow-up 1 (A1): scheduled in Brevo before the Notion write, so its ID is saved on the row in
  // the same write and a booking can always cancel it. Skipped without an email, and for a second
  // submit from the same visit (that lead already has one). Never blocks the Notion save: on any
  // Brevo error the row is simply saved without an ID.
  let followUp1Id = "";
  let followUp1Status = "skipped";
  if (lead.email) {
    let alreadyScheduled = false;
    try { alreadyScheduled = Boolean((await findLeadBy(PROPS.leadId, lead.lead_id))?.followUp1Id); } catch { /* treat as new */ }
    if (!alreadyScheduled) {
      const a1 = followUp1(lead.business, bookingLink(lead.email, lead.lead_id));
      followUp1Id = await sendLeadEmail(lead.email, a1.subject, a1.text, new Date(Date.now() + FOLLOW_UP_1_DELAY_MS));
      followUp1Status = followUp1Id ? "scheduled" : "failed";
    }
  }

  let notionUrl = "";
  let pageId = "";
  let notionError = "";
  try {
    const page = await createLead({
      [PROPS.business]: prop.title(lead.business),
      [PROPS.niche]: prop.select(lead.trade),
      [PROPS.budget]: prop.select(lead.ad_budget),
      [PROPS.phone]: prop.phone(lead.phone),
      [PROPS.goal]: prop.text(lead.goal),
      [PROPS.fit]: prop.select(fit),
      [PROPS.status]: prop.select(STATUS.qualified),
      [PROPS.source]: prop.select(SOURCE.qualifier),
      [PROPS.consent]: prop.select(CONSENT_OPTED_IN),
      [PROPS.leadId]: prop.text(lead.lead_id),
      [PROPS.utmSource]: prop.text(lead.utm_source),
      [PROPS.utmMedium]: prop.text(lead.utm_medium),
      [PROPS.utmCampaign]: prop.text(lead.utm_campaign),
      [PROPS.utmContent]: prop.text(lead.utm_content),
      [PROPS.fbclid]: prop.text(lead.fbclid),
      ...(lead.email ? { [PROPS.email]: prop.email(lead.email) } : {}),
      ...(followUp1Id ? { [PROPS.followUp1Id]: prop.text(followUp1Id) } : {}),
    });
    notionUrl = page.url;
    pageId = page.id;
  } catch (err) {
    notionError = (err as Error).message;
    console.error("[lead] Notion write failed:", notionError);
    // No row means nothing could cancel follow-up 1 after a booking, so don't send it.
    if (followUp1Id) followUp1Status = (await cancelScheduledEmail(followUp1Id)) ? "cancelled" : "cancel_failed";
  }

  const slackText = notionUrl
    ? `New lead: ${summary} · Fit: ${fit}\n${slackLink(notionUrl, "Open in Notion")}`
    : [
        `⚠️ New lead (NOT saved to Notion: ${slackEscape(notionError)}): ${summary} · Fit: ${fit}`,
        lead.goal ? `Goal: ${slackEscape(lead.goal)}` : "",
        `Lead ID: ${lead.lead_id}`,
        [lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content].some(Boolean)
          ? `UTM: ${slackEscape([lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content].join(" / "))}` : "",
      ].filter(Boolean).join("\n");

  // Email (Brevo): a new-lead alert, or, if Notion failed, every submitted field so it can be
  // entered by hand. sendAlertEmail never throws and times out on its own, so it can't block
  // anything; it runs alongside Slack.
  const subjectName = lead.business.replace(/\s+/g, " ");
  const v = (s: string) => s || "-";
  const emailJob = notionUrl
    ? sendAlertEmail(`New lead (not booked yet): ${subjectName}`, [
        "A new lead came in on ossmark.media. They haven't booked a call yet.",
        "",
        `Business: ${lead.business}`,
        `Trade: ${lead.trade}`,
        `Monthly ad spend: ${lead.ad_budget}`,
        `Wants more of: ${v(lead.goal)}`,
        `Phone: ${lead.phone}`,
        `Email: ${v(lead.email)}`,
        `Fit: ${fit}`,
        `Notion: ${notionUrl}`,
      ].join("\n"))
    : sendAlertEmail(`ACTION NEEDED: lead not saved to Notion: ${subjectName}`, [
        "This lead was NOT saved to Notion. Please add it by hand.",
        `Notion error: ${notionError}`,
        "",
        `Business: ${lead.business}`,
        `Phone: ${lead.phone}`,
        `Email: ${v(lead.email)}`,
        `Trade: ${lead.trade}`,
        `Monthly ad spend: ${lead.ad_budget}`,
        `Wants more of: ${v(lead.goal)}`,
        `Fit: ${fit}`,
        `Lead ID: ${lead.lead_id} (put this in "Lead ID" so a later booking links to the row)`,
        `UTM source: ${v(lead.utm_source)}`,
        `UTM medium: ${v(lead.utm_medium)}`,
        `UTM campaign: ${v(lead.utm_campaign)}`,
        `UTM content: ${v(lead.utm_content)}`,
        `fbclid: ${v(lead.fbclid)}`,
        `Received: ${formatET(new Date().toISOString())}`,
      ].join("\n"));
  const [slackOk, emailOk] = await Promise.all([sendSlack(slackText), emailJob]);
  console.log(`[lead] done notion=${Boolean(pageId)} slack=${slackOk} email=${emailOk} followup1=${followUp1Status}`);

  return json({ ok: true, pageId: pageId || null });
}
