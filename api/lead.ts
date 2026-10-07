// POST /api/lead: saves a qualifier submission to Notion and posts a Slack alert.
// The page sends this in the background and never waits on it, so failures here only affect
// record-keeping; a failed Notion write still reaches Slack with every detail, and likely bots
// go to Slack flagged instead of being dropped. Every early return logs a one-line reason.
import { clientIp, env, json, originAllowed, rateLimited, readBody } from "./_lib/http.js";
import { sendSlack, slackEscape, slackLink } from "./_lib/alerts.js";
import { CONSENT_OPTED_IN, createLead, PROPS, prop, SOURCE, STATUS } from "./_lib/notion.js";
import { fitFor, isBudget, isPhone, isTrade, LIMITS } from "../src/lib/qualifier.js";

type LeadInput = {
  lead_id: string; trade: string; ad_budget: string; business: string; phone: string; goal: string;
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
  return { lead };
}

/** Faster than this from first touching the form to submitting is treated as a likely bot. */
const MIN_FORM_MS = 3000;

/** One log line per early return: a reason only, never secrets or what the visitor typed. */
const reject = (reason: string, res: Response) => { console.warn(`[lead] rejected: ${reason}`); return res; };

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
    });
    notionUrl = page.url;
    pageId = page.id;
  } catch (err) {
    notionError = (err as Error).message;
    console.error("[lead] Notion write failed:", notionError);
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
  const slackOk = await sendSlack(slackText);
  console.log(`[lead] done notion=${Boolean(pageId)} slack=${slackOk}`);

  return json({ ok: true, pageId: pageId || null });
}
