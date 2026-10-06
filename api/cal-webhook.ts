// POST /api/cal-webhook: keeps the Notion lead in sync with Cal.com bookings and sends alerts.
// Handles BOOKING_CREATED, BOOKING_RESCHEDULED and BOOKING_CANCELLED. Unsigned or badly signed
// requests are rejected. Cal retries deliveries, so a repeat of an event that's already recorded
// (same booking uid and status) is acknowledged without touching Notion or alerting again.
import { env, json, readBody } from "./_lib/http.js";
import { sendAlertEmail, sendSlack, slackEscape, slackLink } from "./_lib/alerts.js";
import { attendee, formatET, HANDLED, validSignature, type CalEvent, type CalPayload, type CalWebhook } from "./_lib/cal.js";
import { CONSENT_OPTED_IN, createLead, findLeadBy, PROPS, prop, SOURCE, STATUS, updateLead, type Lead, type Props } from "./_lib/notion.js";
import { fitFor, isBudget, isTrade } from "../src/lib/qualifier.js";

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

  // Values from the booking itself, used when creating a lead and as alert fallbacks.
  const trade = isTrade(meta.trade ?? "") ? meta.trade! : "";
  const budget = isBudget(meta.ad_budget ?? "") ? meta.ad_budget! : "";
  const goal = meta.goal && meta.goal !== "-" ? meta.goal.slice(0, 500) : "";
  const fit = meta.fit === "ok" || meta.fit === "review" ? meta.fit : trade && budget ? fitFor(trade, budget) : "";

  let lead: Lead | null = null;
  let notionError = "";
  try {
    lead = (await findLeadBy(PROPS.leadId, meta.lead_id ?? ""))
      ?? (await findLeadBy(PROPS.bookingId, uid))
      ?? (oldUid ? await findLeadBy(PROPS.bookingId, oldUid) : null);

    // Idempotency: this exact event is already recorded, so it's a retry.
    if (lead && uid && lead.bookingId === uid && lead.status === target) {
      return json({ ok: true, duplicate: true });
    }

    const changes: Props = {
      [PROPS.status]: prop.select(target),
      [PROPS.booked]: prop.checkbox(ev !== "BOOKING_CANCELLED"),
      [PROPS.bookingId]: prop.text(uid),
      ...(p.startTime && ev !== "BOOKING_CANCELLED" ? { [PROPS.callTime]: prop.date(p.startTime) } : {}),
      ...(who.email ? { [PROPS.email]: prop.email(who.email) } : {}),
    };

    if (lead) {
      lead = await updateLead(lead.id, changes);
    } else {
      // No matching lead: a direct booking, or a qualifier lead whose Notion write failed earlier.
      const answeredQualifier = Boolean(trade || meta.lead_id);
      lead = await createLead({
        [PROPS.business]: prop.title(notes.business || who.name || who.email || "Unknown"),
        [PROPS.source]: prop.select(answeredQualifier ? SOURCE.qualifier : SOURCE.direct),
        [PROPS.consent]: prop.select(CONSENT_OPTED_IN),
        ...(trade ? { [PROPS.niche]: prop.select(trade) } : {}),
        ...(budget ? { [PROPS.budget]: prop.select(budget) } : {}),
        ...(goal ? { [PROPS.goal]: prop.text(goal) } : {}),
        ...(fit ? { [PROPS.fit]: prop.select(fit) } : {}),
        ...(notes.phone ? { [PROPS.phone]: prop.phone(notes.phone) } : {}),
        ...(meta.lead_id ? { [PROPS.leadId]: prop.text(meta.lead_id) } : {}),
        ...changes,
      });
    }
  } catch (err) {
    notionError = (err as Error).message;
    console.error("[cal-webhook] Notion sync failed:", notionError);
  }

  // ---- alerts (each channel independent) ---------------------------------------------
  const business = lead?.business || notes.business || who.name || "Unknown business";
  const d = {
    trade: lead?.niche || trade || "-",
    budget: budget || lead?.budget || "-",
    goal: lead?.goal || goal || "-",
    phone: lead?.phone || notes.phone || "-",
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
      `Call: ${when || "see Cal.com"} (America/New_York)`,
      `Fit: ${d.fit}`,
      `Notion: ${lead?.url || "not saved" + (notionError ? ` (${notionError})` : "")}`,
    ].join("\n")));
  } else if (ev === "BOOKING_RESCHEDULED") {
    const was = formatET(p.rescheduleStartTime);
    jobs.push(sendSlack(`Rescheduled: ${b} → ${slackEscape(when || "new time unknown")}${was ? ` (was ${slackEscape(was)})` : ""}\n${notionLine}${warn}`));
  } else {
    jobs.push(sendSlack(`Cancelled: ${b}${when ? ` · was ${slackEscape(when)}` : ""}\n${notionLine}${warn}`));
  }
  await Promise.all(jobs);

  return json({ ok: true, notion: !notionError, lead: lead?.id ?? null });
}
