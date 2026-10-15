// A fake fetch for the /api tests: answers like Notion, Brevo and Slack, and records every call.
// Nothing in the tests reaches a real service.
import { vi } from "vitest";

export type Call = { method: string; url: string; body: Record<string, unknown> | null; headers: Record<string, string> };

export const ENV = {
  NOTION_TOKEN: "test-notion",
  NOTION_API_BASE: "http://notion.test",
  SLACK_WEBHOOK_URL: "http://slack.test/hook",
  BREVO_API_KEY: "test-brevo",
  BREVO_SENDER_EMAIL: "alerts@ossmark.media",
  BREVO_API_BASE: "http://brevo.test",
  ALERT_EMAIL: "donoven@ossmark.media",
  CAL_WEBHOOK_SECRET: "whsec_test",
  CRON_SECRET: "cron_test",
};

/** A Notion page shaped like the API returns it (only the properties the code reads). */
export function notionPage(p: {
  id?: string; created?: string; business?: string; leadId?: string; email?: string; niche?: string;
  followUp1Id?: string; bookingId?: string; status?: string;
}): Record<string, unknown> {
  const text = (v = "") => ({ type: "rich_text", rich_text: v ? [{ plain_text: v }] : [] });
  const sel = (v = "") => ({ type: "select", select: v ? { name: v } : null });
  return {
    id: p.id ?? "page-1",
    url: `https://www.notion.so/${(p.id ?? "page-1").replace(/-/g, "")}`,
    created_time: p.created ?? new Date().toISOString(),
    properties: {
      "Business Name": { type: "title", title: [{ plain_text: p.business ?? "Cool Air Co" }] },
      "Lead ID": text(p.leadId),
      "Email": { type: "email", email: p.email ?? null },
      "Niche": sel(p.niche),
      "Lead Status": sel(p.status),
      "Cal booking ID": text(p.bookingId),
      "Follow-up 1 ID": text(p.followUp1Id),
    },
  };
}

type Handler = (call: Call) => { status: number; body?: unknown } | undefined;

/** Installs the fake. `routes` overrides the defaults for a test; return undefined to fall through. */
export function installFakes(routes: Handler = () => undefined) {
  const calls: Call[] = [];
  Object.assign(process.env, ENV);
  const fetchFake = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input instanceof Request ? input.url : input);
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    const call: Call = { method: init.method ?? "GET", url, headers, body: init.body ? JSON.parse(String(init.body)) : null };
    calls.push(call);
    const res = routes(call) ?? defaults(call);
    return new Response(res.body === undefined ? null : JSON.stringify(res.body), { status: res.status, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchFake);
  return {
    calls,
    brevoSends: () => calls.filter((c) => c.method === "POST" && c.url === "http://brevo.test/v3/smtp/email"),
    brevoDeletes: () => calls.filter((c) => c.method === "DELETE" && c.url.startsWith("http://brevo.test/v3/smtp/email/")),
    slack: () => calls.filter((c) => c.url === "http://slack.test/hook").map((c) => String(c.body?.text)),
    notionCreates: () => calls.filter((c) => c.method === "POST" && c.url === "http://notion.test/v1/pages"),
    notionQueries: () => calls.filter((c) => c.url.endsWith("/query")),
    notionPatches: () => calls.filter((c) => c.method === "PATCH"),
  };
}

let nextId = 0;
function defaults(call: Call): { status: number; body?: unknown } {
  if (call.url.startsWith("http://notion.test")) {
    if (call.url.endsWith("/query")) return { status: 200, body: { results: [] } };
    if (call.method === "POST") return { status: 200, body: notionPage({ id: `page-${++nextId}` }) };
    if (call.method === "PATCH") return { status: 200, body: notionPage({ id: call.url.split("/").pop() }) };
  }
  if (call.url === "http://brevo.test/v3/smtp/email") return { status: 201, body: { messageId: `<msg-${++nextId}@smtp-relay.brevo.com>` } };
  if (call.method === "DELETE" && call.url.startsWith("http://brevo.test/")) return { status: 204 };
  if (call.url === "http://slack.test/hook") return { status: 200 };
  return { status: 404, body: {} };
}

let ip = 0;
/** A POST to /api/lead from the live site, from a fresh IP (so the rate limit never interferes). */
export function leadRequest(body: Record<string, unknown>): Request {
  return new Request("https://ossmark.media/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://ossmark.media", "x-forwarded-for": `10.1.0.${++ip}` },
    body: JSON.stringify(body),
  });
}

export const validLead = (over: Record<string, unknown> = {}) => ({
  lead_id: "lead-1234-abcd",
  trade: "HVAC",
  ad_budget: "$2,500–$5,000",
  goal: "More AC installs",
  fit: "ok",
  business: "Cool Air Co",
  phone: "(856) 555-0123",
  email: "owner@coolair.co",
  hp_ref: "",
  form_ms: 9000,
  ...over,
});
