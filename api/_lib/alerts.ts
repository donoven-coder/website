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
