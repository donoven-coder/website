// GET /api/cron/follow-up: the daily job that sends follow-up 2 (A2). Vercel Cron calls it at
// 14:00 UTC (?run=edt) and 15:00 UTC (?run=est) (vercel.json); only the run in the 10 o'clock hour in New York
// does anything, so it goes out at about 10am ET in both summer (EDT) and winter (EST).
// Vercel sends "Authorization: Bearer <CRON_SECRET>"; without CRON_SECRET set the job never runs.
import { env, json } from "../_lib/http.js";
import { sendLeadEmail, sendSlack, slackEscape } from "../_lib/alerts.js";
import { bookingLink, followUp2 } from "../_lib/followups.js";
import { findFollowUp2Due, PROPS, prop, updateLead } from "../_lib/notion.js";

/** A2 goes to leads added at least this long ago. */
const WAIT_MS = 2 * 24 * 60 * 60 * 1000;
/** Most leads handled per run (keeps one run well inside the function time limit). */
const MAX_PER_RUN = 25;

const hourInNewYork = (d: Date) =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(d));

export async function GET(request: Request): Promise<Response> {
  const secret = env("CRON_SECRET");
  if (!secret) { console.error("[cron] CRON_SECRET not set; follow-up job refused"); return json({ ok: false, error: "not_configured" }, 500); }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.warn("[cron] rejected: bad or missing authorization");
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const now = new Date();
  // ?force=1 (still needs the secret) runs it outside 10am, for testing.
  if (hourInNewYork(now) !== 10 && new URL(request.url).searchParams.get("force") !== "1") {
    console.log(`[cron] skipped: ${hourInNewYork(now)}:00 in New York, not 10:00`);
    return json({ ok: true, skipped: "not_10am_et" });
  }

  let leads;
  try {
    leads = await findFollowUp2Due(new Date(now.getTime() - WAIT_MS), MAX_PER_RUN);
  } catch (err) {
    console.error("[cron] Notion query failed:", (err as Error).message);
    return json({ ok: false, error: "notion" }, 502);
  }

  let sent = 0, failed = 0;
  for (const lead of leads) {
    const a2 = followUp2(lead.business, lead.niche, bookingLink(lead.email, lead.leadId));
    const id = await sendLeadEmail(lead.email, a2.subject, a2.text);
    if (!id) { failed++; continue; } // left unticked, so tomorrow's run tries again
    sent++;
    try {
      await updateLead(lead.id, { [PROPS.followUp2Sent]: prop.checkbox(true) });
    } catch (err) {
      // Sent but not recorded: tomorrow's run would send it again unless the box is ticked by hand.
      console.error("[cron] Notion update failed after sending:", (err as Error).message);
      await sendSlack(`⚠️ Follow-up 2 went to ${slackEscape(lead.business)}, but Notion wasn't updated. Tick "Follow-up 2 sent" on their row so it doesn't send again.\n${lead.url}`);
    }
  }
  console.log(`[cron] follow-up 2: due=${leads.length} sent=${sent} failed=${failed}`);
  return json({ ok: true, due: leads.length, sent, failed });
}
