import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../api/cron/follow-up";
import { ENV, installFakes, notionPage } from "./fakes";

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); for (const m of ["log", "warn", "error"] as const) vi.spyOn(console, m).mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const run = (auth: string | null = `Bearer ${ENV.CRON_SECRET}`, query = "?run=edt") =>
  GET(new Request(`https://ossmark.media/api/cron/follow-up${query}`, { headers: auth ? { authorization: auth } : {} }));
const due = (...pages: Record<string, unknown>[]) => (c: { url: string }) => c.url.endsWith("/query") ? { status: 200, body: { results: pages } } : undefined;
const hvac = notionPage({ id: "page-hvac", business: "Cool Air Co", niche: "HVAC", email: "owner@coolair.co", leadId: "lead-aaaa-1111" });
const roof = notionPage({ id: "page-roof", business: "Top Roofing", niche: "Roofing", email: "boss@toproof.co", leadId: "lead-bbbb-2222" });

describe("follow-up 2 cron: access", () => {
  it("refuses to run when CRON_SECRET isn't set", async () => {
    const fakes = installFakes(); delete process.env.CRON_SECRET;
    vi.setSystemTime(new Date("2026-07-15T14:10:00Z"));
    expect((await run()).status).toBe(500);
    expect(fakes.calls).toHaveLength(0);
  });
  it.each([null, "Bearer wrong", "cron_test"])("rejects authorization %j", async (auth) => {
    const fakes = installFakes();
    vi.setSystemTime(new Date("2026-07-15T14:10:00Z"));
    expect((await run(auth)).status).toBe(401);
    expect(fakes.calls).toHaveLength(0);
  });
});

describe("follow-up 2 cron: 10am in New York", () => {
  it.each([
    ["2026-07-15T14:20:00Z", "summer, 14:20 UTC = 10:20 EDT", true],
    ["2026-07-15T15:20:00Z", "summer, 15:20 UTC = 11:20 EDT", false],
    ["2026-01-15T15:20:00Z", "winter, 15:20 UTC = 10:20 EST", true],
    ["2026-01-15T14:20:00Z", "winter, 14:20 UTC = 9:20 EST", false],
    ["2026-03-08T14:05:00Z", "DST starts that morning: 10:05 EDT", true],
    ["2026-11-01T15:05:00Z", "DST ends that morning: 10:05 EST", true],
  ])("%s (%s) runs: %s", async (iso, _label, runs) => {
    const fakes = installFakes();
    vi.setSystemTime(new Date(iso));
    const body = await (await run()).json();
    expect(fakes.notionQueries().length > 0).toBe(runs);
    if (!runs) expect(body).toEqual({ ok: true, skipped: "not_10am_et" });
  });
  it("?force=1 runs outside 10am (still needs the secret)", async () => {
    const fakes = installFakes();
    vi.setSystemTime(new Date("2026-07-15T18:00:00Z"));
    await run(undefined, "?force=1");
    expect(fakes.notionQueries()).toHaveLength(1);
  });
});

describe("follow-up 2 cron: who gets it", () => {
  it("asks Notion only for website leads with an email, 2+ days old, never booked, not Do Not Contact, not already sent", async () => {
    const fakes = installFakes();
    vi.setSystemTime(new Date("2026-07-15T14:20:00Z"));
    await run();
    const body = fakes.notionQueries()[0].body!;
    expect(fakes.notionQueries()[0].url).toBe("http://notion.test/v1/data_sources/266b9e70-03ea-8265-97af-07de7848d68d/query");
    expect(body.page_size).toBe(25);
    expect((body.filter as { and: unknown[] }).and).toEqual([
      { property: "Lead Source", select: { equals: "Website qualifier" } },
      { property: "Lead ID", rich_text: { is_not_empty: true } },
      { property: "Email", email: { is_not_empty: true } },
      { timestamp: "created_time", created_time: { on_or_before: "2026-07-13T14:20:00.000Z" } },
      { property: "Booked", checkbox: { equals: false } },
      { property: "Cal booking ID", rich_text: { is_empty: true } },
      { property: "Do Not Contact", checkbox: { equals: false } },
      { property: "Follow-up 2 sent", checkbox: { equals: false } },
    ]);
  });
});

describe("follow-up 2 cron: sending", () => {
  it("sends A2 (guarantee for HVAC, call offer for others) and ticks Follow-up 2 sent", async () => {
    const fakes = installFakes(due(hvac, roof));
    vi.setSystemTime(new Date("2026-07-15T14:20:00Z"));
    expect(await (await run()).json()).toEqual({ ok: true, due: 2, sent: 2, failed: 0 });

    const [toHvac, toRoof] = fakes.brevoSends();
    for (const s of [toHvac, toRoof]) {
      expect(s.body).toMatchObject({ sender: { email: "alerts@ossmark.media", name: "Donoven Hamilton" }, replyTo: { email: "donoven@ossmark.media" }, subject: "Still looking for more booked jobs?" });
      expect(s.body).not.toHaveProperty("scheduledAt");
    }
    expect(toHvac.body!.to).toEqual([{ email: "owner@coolair.co" }]);
    expect(String(toHvac.body!.textContent)).toContain("It's backed by a guarantee: 20 booked jobs in 60 days");
    expect(String(toHvac.body!.textContent)).toContain("https://cal.com/ossmark-media-qzze1b/15min?email=owner%40coolair.co&metadata%5Blead_id%5D=lead-aaaa-1111");
    expect(String(toRoof.body!.textContent)).toContain("On a 15-minute call I'll show you what that looks like for Top Roofing.");
    expect(String(toRoof.body!.textContent)).not.toContain("guarantee");

    expect(fakes.notionPatches().map((c) => [c.url, c.body])).toEqual([
      ["http://notion.test/v1/pages/page-hvac", { properties: { "Follow-up 2 sent": { checkbox: true } } }],
      ["http://notion.test/v1/pages/page-roof", { properties: { "Follow-up 2 sent": { checkbox: true } } }],
    ]);
  });

  it("leaves the box unticked when the send fails, so tomorrow retries", async () => {
    const fakes = installFakes((c) => c.url === "http://brevo.test/v3/smtp/email" && (c.body!.to as { email: string }[])[0].email === "boss@toproof.co" ? { status: 500, body: {} } : due(hvac, roof)(c));
    vi.setSystemTime(new Date("2026-07-15T14:20:00Z"));
    expect(await (await run()).json()).toEqual({ ok: true, due: 2, sent: 1, failed: 1 });
    expect(fakes.notionPatches().map((c) => c.url)).toEqual(["http://notion.test/v1/pages/page-hvac"]);
  });

  it("warns in Slack when it sent but couldn't tick the box", async () => {
    const fakes = installFakes((c) => c.method === "PATCH" ? { status: 502, body: { code: "bad_gateway" } } : due(hvac)(c));
    vi.setSystemTime(new Date("2026-07-15T14:20:00Z"));
    await run();
    expect(fakes.slack()).toEqual([expect.stringMatching(/^⚠️ Follow-up 2 went to Cool Air Co, but Notion wasn't updated\./)]);
  });
});
