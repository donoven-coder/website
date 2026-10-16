// POST /api/cal-webhook: keeps the Notion lead in sync with Cal.com bookings and sends alerts.
// Handles BOOKING_CREATED, BOOKING_RESCHEDULED and BOOKING_CANCELLED. Unsigned or badly signed
// requests are rejected. Cal retries deliveries, so a repeat of an event that's already recorded
// (same booking uid and status) is acknowledged without touching Notion or alerting again.
import { env, json, readBody } from "./_lib/http.js";
import { cancelScheduledEmail, sendAlertEmail, sendSlack, slackEscape, slackLink } from "./_lib/alerts.js";
import { answer, attendee, formatET, HANDLED, validSignature, type CalEvent, type CalPayload, type CalWebhook } from "./_lib/cal.js";
import { CONSENT_OPTED_IN, createLead, findLeadBy, PROPS, prop, SOURCE, STATUS, updateLead, type Lead, type Props } from "./_lib/notion.js";
import { fitFor, isBudget, isPhone, isTrade, LIMITS, OTHER_TRADE } from "../src/lib/qualifier.js";

const TARGET_STATUS: Record<CalEvent, string> = {
  BOOKING_CREATED: STATUS.booked,
  BOOKING_RESCHEDULED: STATUS.rescheduled,
  BOOKING_CANCELLED: STATUS.cancelled,
};

/** "Business: …" / "Phone: …" lines the site puts in the booking notes; used if Notion has no lead. */
function fromNotes(p: CalPayload & { additionalNotes?: string; description?: string }) {
  const notes = `${p.additionalNotes ?? ""}\n${p.description ?? ""}`;
  const line = (label: string) => notes.match(new RegExp(`^${label}:\\s*(.+)$`, "m"))?.[1]?.trim().slice(0, 120) ?? "";
  return { business: line("Business"), phone: line("Phone") };
}

export async function POST(request: Request): Promise<Response> {
  const raw = await readBody(request, 200_000);
  if (raw === null) return json({ ok: false, error: "too_large" }, 413);
  if (!validSignature(raw, request.headers.get("x-cal-signature-256"), env("CAL_WEBHOOK_SECRET"))) {
    return json({ ok: false, error: "signature" }, 401);
  }

  let hook: CalWebhook;
  try { hook = JSON.parse(raw) as CalWebhook; } catch { return json({ ok: false, error: "json" }, 400); }
  const event = hook.triggerEvent ?? "";
  if (!HANDLED.includes(event)) return json({ ok: true, ignored: event || "unknown" }); // e.g. Cal's ping test
  const ev = event as CalEvent;
  const p = (hook.payload ?? {}) as CalPayload & { additionalNotes?: string; description?: string };
  const uid = String(p.uid ?? "");
  const oldUid = String(p.rescheduleUid ?? p.fromReschedule ?? "");
  const meta = p.metadata ?? {};
  const who = attendee(p);
  const notes = fromNotes(p);
  const when = formatET(p.startTime);
  const target = TARGET_STATUS[ev];

  // Values from the booking itself, used when creating a lead and as alert fallbacks. Cal's booking
  // questions come first (identifiers: business, trade, ad_budget, notes, attendeePhoneNumber); older
  // bookings without them (the qualifier and the follow-up email links) fall back to metadata and the
  // "Business:" / "Phone:" note lines, as before. Trade and ad spend must match the site's options exactly.
  const cal = {
    business: answer(p, "business").slice(0, LIMITS.business),
    // Cal's trade dropdown says "Other"; the site and Notion call it "Other home service".
    trade: answer(p, "trade").toLowerCase() === "other" ? OTHER_TRADE : answer(p, "trade"),
    budget: answer(p, "ad_budget"),
    goal: answer(p, "notes").slice(0, LIMITS.goal),
    phone: (answer(p, "attendeePhoneNumber") || (p.attendees?.[0]?.phoneNumber ?? "").trim()).slice(0, LIMITS.phone),
  };
  const fromBookingForm = Boolean(cal.business || cal.trade || cal.budget);
  const bizName = cal.business || notes.business;
  const rawTrade = cal.trade || meta.trade || "";
  const trade = isTrade(rawTrade) ? rawTrade : "";
  const rawBudget = cal.budget || meta.ad_budget || "";
  const budget = isBudget(rawBudget) ? rawBudget : "";
  const goal = cal.goal || (meta.goal && meta.goal !== "-" ? meta.goal.slice(0, 500) : "");
  const phone = isPhone(cal.phone) ? cal.phone : notes.phone;
  const fit = !cal.trade && (meta.fit === "ok" || meta.fit === "review") ? meta.fit : trade && budget ? fitFor(trade, budget) : "";
  // What the visitor told us, plus first-touch ad attribution (metadata from the site's embed).
  // Only values that are present: an empty one never overwrites what a lead row already has.
  const str = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
  const attribution: [string, string][] = [
    [PROPS.utmSource, str(meta.utm_source, 200)], [PROPS.utmMedium, str(meta.utm_medium, 200)],
    [PROPS.utmCampaign, str(meta.utm_campaign, 200)], [PROPS.utmContent, str(meta.utm_content, 200)],
    [PROPS.fbclid, str(meta.fbclid, 200)],
  ];
  const answers: Props = {
    ...(bizName ? { [PROPS.business]: prop.title(bizName) } : {}),
    ...(who.name ? { [PROPS.contactName]: prop.text(who.name.slice(0, 200)) } : {}),
    ...(trade ? { [PROPS.niche]: prop.select(trade) } : {}),
    ...(budget ? { [PROPS.budget]: prop.select(budget) } : {}),
    ...(goal ? { [PROPS.goal]: prop.text(goal) } : {}),
    ...(fit ? { [PROPS.fit]: prop.select(fit) } : {}),
    ...(phone ? { [PROPS.phone]: prop.phone(phone) } : {}),
    ...Object.fromEntries(attribution.filter(([, v]) => v).map(([k, v]) => [k, prop.text(v)])),
  };

  let lead: Lead | null = null;
  let notionError = "";
  let followUp1Cancelled = false;
  let followUp1CancelFailed = false;
  let followUp1Id = "";
  try {
    lead = (await findLeadBy(PROPS.leadId, meta.lead_id ?? ""))
      ?? (await findLeadBy(PROPS.bookingId, uid))
      ?? (oldUid ? await findLeadBy(PROPS.bookingId, oldUid) : null);

    // Idempotency: this exact event is already recorded, so it's a retry.
    if (lead && uid && lead.bookingId === uid && lead.status === target) {
      return json({ ok: true, duplicate: true });
    }

    // A booking cancels follow-up 1 (A1) while it's still waiting to go out (rows under an hour
    // old; after that it has already been sent). The ID is cleared once Brevo confirms.
    const pending = lead?.followUp1Id && ev !== "BOOKING_CANCELLED" && Date.now() - Date.parse(lead.created || "0") < 60 * 60 * 1000;
    if (pending) {
      followUp1Id = lead!.followUp1Id;
      followUp1Cancelled = await cancelScheduledEmail(followUp1Id);
      followUp1CancelFailed = !followUp1Cancelled;
    }

    const changes: Props = {
      [PROPS.status]: prop.select(target),
      [PROPS.booked]: prop.checkbox(ev !== "BOOKING_CANCELLED"),
      [PROPS.bookingId]: prop.text(uid),
      ...(p.startTime && ev !== "BOOKING_CANCELLED" ? { [PROPS.callTime]: prop.date(p.startTime) } : {}),
      ...(who.email ? { [PROPS.email]: prop.email(who.email) } : {}),
      ...(followUp1Cancelled ? { [PROPS.followUp1Id]: prop.text("") } : {}),
    };

    if (lead) {
      // A new booking also records the answers given with it; reschedules and cancellations don't.
      lead = await updateLead(lead.id, ev === "BOOKING_CREATED" ? { ...answers, ...changes } : changes);
    } else {
      // No matching lead: a booking from the site's calendar (answers in Cal's form), a direct
      // booking, or a qualifier lead whose Notion write failed earlier.
      const answeredQualifier = Boolean(trade || meta.lead_id);
      lead = await createLead({
        ...answers,
        [PROPS.business]: prop.title(bizName || who.name || who.email || "Unknown"),
        [PROPS.source]: prop.select(fromBookingForm ? SOURCE.booking : answeredQualifier ? SOURCE.qualifier : SOURCE.direct),
        [PROPS.consent]: prop.select(CONSENT_OPTED_IN),
        ...(meta.lead_id ? { [PROPS.leadId]: prop.text(meta.lead_id) } : {}),
        ...changes,
      });
    }
  } catch (err) {
    notionError = (err as Error).message;
    console.error("[cal-webhook] Notion sync failed:", notionError);
  }

  // ---- alerts (each channel independent) ---------------------------------------------
  const business = lead?.business || bizName || who.name || "Unknown business";
  const d = {
    trade: lead?.niche || trade || "-",
    budget: budget || lead?.budget || "-",
    goal: lead?.goal || goal || "-",
    phone: lead?.phone || phone || "-",
    fit: lead?.fit || fit || "-",
  };
  const notionLine = lead?.url ? slackLink(lead.url, "Open in Notion") : "";
  const warn = notionError ? `\n⚠️ Notion not updated: ${slackEscape(notionError)}` : "";
  const b = slackEscape(business);

  const jobs: Promise<boolean>[] = [];
  if (ev === "BOOKING_CREATED") {
    jobs.push(sendSlack(`Call booked: ${b} · ${slackEscape(when || "time unknown")} · ${slackEscape(d.trade)} · ${slackEscape(d.budget)} · ${slackEscape(d.phone)} · Fit: ${d.fit}\n${notionLine}${warn}`));
    jobs.push(sendAlertEmail(`Call booked: ${business}, ${when || "time unknown"}`, [
      "A discovery call was booked on ossmark.media.",
      "",
      `Name: ${who.name || "-"}`,
      `Business: ${business}`,
      `Trade: ${d.trade}`,
      `Monthly ad spend: ${d.budget}`,
      `Wants more of: ${d.goal}`,
      `Phone: ${d.phone}`,
      `Email: ${who.email || "-"}`,
      `Call: ${when || "see Cal.com"}`,
      `Fit: ${d.fit}`,
      `Notion: ${lead?.url || "not saved" + (notionError ? ` (${notionError})` : "")}`,
    ].join("\n")));
  } else if (ev === "BOOKING_RESCHEDULED") {
    const was = formatET(p.rescheduleStartTime);
    jobs.push(sendSlack(`Rescheduled: ${b} → ${slackEscape(when || "new time unknown")}${was ? ` (was ${slackEscape(was)})` : ""}\n${notionLine}${warn}`));
  } else {
    jobs.push(sendSlack(`Cancelled: ${b}${when ? ` · was ${slackEscape(when)}` : ""}\n${notionLine}${warn}`));
  }
  if (followUp1CancelFailed) {
    jobs.push(sendSlack(`⚠️ Couldn't cancel follow-up 1 for ${b} (they booked). It may still go out within the hour.\n${notionLine}`));
    jobs.push(sendAlertEmail(`Follow-up 1 may still send: ${business.replace(/\s+/g, " ")}`, [
      `${business} booked a call, but follow-up 1 ("Your call isn't booked yet") couldn't be cancelled in Brevo.`,
      "It may still go out within the hour.",
      "",
      `Their email: ${who.email || lead?.email || "-"}`,
      `Brevo message ID: ${followUp1Id}`,
      `Notion: ${lead?.url || "-"}`,
    ].join("\n")));
  }
  await Promise.all(jobs);

  return json({ ok: true, notion: !notionError, lead: lead?.id ?? null });
}
