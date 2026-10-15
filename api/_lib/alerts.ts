// Alert channels. Each one is independent: it has its own timeout, never throws, and reports
// whether it went out, so a Slack or Brevo outage can't block Notion or the other channel.
import { env, fetchWithTimeout } from "./http.js";

/** Escapes text for Slack's mrkdwn (&, <, >). */
export const slackEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const slackLink = (url: string, label: string) => `<${url}|${slackEscape(label)}>`;

export async function sendSlack(text: string): Promise<boolean> {
  const url = env("SLACK_WEBHOOK_URL");
  if (!url) { console.warn("[alerts] SLACK_WEBHOOK_URL not set; Slack alert skipped"); return false; }
  try {
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }, 4000);
    if (!res.ok) console.error("[alerts] Slack responded", res.status);
    return res.ok;
  } catch (err) {
    console.error("[alerts] Slack failed:", (err as Error).name);
    return false;
  }
}

/** Plain-text email to ALERT_EMAIL through Brevo's transactional API. */
export async function sendAlertEmail(subject: string, text: string): Promise<boolean> {
  const key = env("BREVO_API_KEY");
  const sender = env("BREVO_SENDER_EMAIL");
  if (!key || !sender) { console.warn("[alerts] BREVO_API_KEY or BREVO_SENDER_EMAIL not set; email skipped"); return false; }
  try {
    const res = await fetchWithTimeout(`${env("BREVO_API_BASE", "https://api.brevo.com")}/v3/smtp/email`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: sender, name: env("BREVO_SENDER_NAME", "Ossmark Media website") },
        to: [{ email: env("ALERT_EMAIL", "donoven@ossmark.media") }],
        subject,
        textContent: text,
      }),
    }, 5000);
    if (!res.ok) console.error("[alerts] Brevo responded", res.status);
    return res.ok;
  } catch (err) {
    console.error("[alerts] Brevo failed:", (err as Error).name);
    return false;
  }
}

/**
 * Plain-text email to a lead (follow-ups), from BREVO_SENDER_EMAIL as "Donoven Hamilton", with
 * replies going to FOLLOWUP_REPLY_TO (default donoven@ossmark.media). With `scheduledAt`, Brevo
 * holds it until then (up to 72 hours ahead). Returns Brevo's messageId, or "" if it didn't go out.
 * Never throws.
 */
export async function sendLeadEmail(to: string, subject: string, text: string, scheduledAt?: Date): Promise<string> {
  const key = env("BREVO_API_KEY");
  const sender = env("BREVO_SENDER_EMAIL");
  if (!key || !sender) { console.warn("[alerts] BREVO_API_KEY or BREVO_SENDER_EMAIL not set; follow-up email skipped"); return ""; }
  try {
    const res = await fetchWithTimeout(`${env("BREVO_API_BASE", "https://api.brevo.com")}/v3/smtp/email`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: sender, name: "Donoven Hamilton" },
        to: [{ email: to }],
        replyTo: { email: env("FOLLOWUP_REPLY_TO", "donoven@ossmark.media") },
        subject,
        textContent: text,
        ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
      }),
    }, 5000);
    if (!res.ok) { console.error("[alerts] Brevo (follow-up) responded", res.status); return ""; }
    const data = (await res.json().catch(() => ({}))) as { messageId?: unknown };
    return typeof data.messageId === "string" ? data.messageId : "";
  } catch (err) {
    console.error("[alerts] Brevo (follow-up) failed:", (err as Error).name);
    return "";
  }
}

/** Cancels an email scheduled with sendLeadEmail. True if Brevo deleted it. Never throws. */
export async function cancelScheduledEmail(messageId: string): Promise<boolean> {
  const key = env("BREVO_API_KEY");
  if (!key || !messageId) return false;
  try {
    const res = await fetchWithTimeout(`${env("BREVO_API_BASE", "https://api.brevo.com")}/v3/smtp/email/${encodeURIComponent(messageId)}`, {
      method: "DELETE",
      headers: { "api-key": key, Accept: "application/json" },
    }, 5000);
    if (!res.ok) console.error("[alerts] Brevo (cancel follow-up) responded", res.status);
    return res.ok;
  } catch (err) {
    console.error("[alerts] Brevo (cancel follow-up) failed:", (err as Error).name);
    return false;
  }
}
