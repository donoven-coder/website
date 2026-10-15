import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/cal-webhook";
import { ENV, installFakes, notionPage } from "./fakes";

const NOW = new Date("2026-10-12T14:30:00.000Z");
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const A1_ID = "<a1-111@smtp-relay.brevo.com>";
function hook(triggerEvent: string, payload: Record<string, unknown>): Request {
  const raw = JSON.stringify({ triggerEvent, payload });
  return new Request("https://ossmark.media/api/cal-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cal-signature-256": createHmac("sha256", ENV.CAL_WEBHOOK_SECRET).update(raw).digest("hex") },
    body: raw,
  });
}
const booking = (over: Record<string, unknown> = {}) => ({
  uid: "bk_1", startTime: "2026-10-14T19:00:00.000Z",
  attendees: [{ name: "Maria Lopez", email: "owner@coolair.co" }],
  metadata: { lead_id: "lead-1234-abcd" }, ...over,
});
/** Notion has the qualifier lead, created `minutesAgo` minutes ago, with a scheduled follow-up 1. */
const withLead = (minutesAgo: number) => (c: { url: string }) => c.url.endsWith("/query")
  ? { status: 200, body: { results: [notionPage({ id: "page-lead", leadId: "lead-1234-abcd", followUp1Id: A1_ID, created: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString() })] } }
  : undefined;

describe("booking cancels follow-up 1", () => {
  it("deletes the scheduled email and clears Follow-up 1 ID", async () => {
    const fakes = installFakes(withLead(20));
    expect((await POST(hook("BOOKING_CREATED", booking()))).status).toBe(200);
    expect(fakes.brevoDeletes().map((c) => c.url)).toEqual([`http://brevo.test/v3/smtp/email/${encodeURIComponent(A1_ID)}`]);
    const props = fakes.notionPatches()[0].body!.properties as Record<string, unknown>;
    expect(props["Follow-up 1 ID"]).toEqual({ rich_text: [] });
    expect(props["Booked"]).toEqual({ checkbox: true });
    expect(fakes.slack().some((t) => t.includes("Couldn't cancel"))).toBe(false);
    expect(fakes.brevoSends().some((c) => String(c.body!.subject).startsWith("Follow-up 1 may still send"))).toBe(false);
  });

  it("warns in Slack and by alert email when Brevo won't delete it, and keeps the ID", async () => {
    const fakes = installFakes((c) => c.method === "DELETE" ? { status: 404, body: { message: "Record not found" } } : withLead(20)(c));
    expect((await POST(hook("BOOKING_CREATED", booking()))).status).toBe(200);
    expect(fakes.slack()).toContainEqual(expect.stringMatching(/^⚠️ Couldn't cancel follow-up 1 for Cool Air Co \(they booked\)\. It may still go out within the hour\./));
    const warn = fakes.brevoSends().find((c) => String(c.body!.subject).startsWith("Follow-up 1 may still send"))!;
    expect(warn.body).toMatchObject({
      subject: "Follow-up 1 may still send: Cool Air Co",
      to: [{ email: "donoven@ossmark.media" }],
      sender: { email: "alerts@ossmark.media", name: "Ossmark Media website" },
    });
    expect(String(warn.body!.textContent).split("\n")).toEqual([
      "Cool Air Co booked a call, but follow-up 1 (\"Your call isn't booked yet\") couldn't be cancelled in Brevo.",
      "It may still go out within the hour.",
      "",
      "Their email: owner@coolair.co",
      `Brevo message ID: ${A1_ID}`,
      "Notion: https://www.notion.so/pagelead",
    ]);
    expect(fakes.notionPatches()[0].body!.properties).not.toHaveProperty("Follow-up 1 ID");
  });

  it("still answers 200, updates Notion and posts to Slack when that alert email fails too", async () => {
    const fakes = installFakes((c) => c.method === "DELETE" ? { status: 404, body: {} }
      : c.url === "http://brevo.test/v3/smtp/email" ? { status: 500, body: {} } : withLead(20)(c));
    expect((await POST(hook("BOOKING_CREATED", booking()))).status).toBe(200);
    expect(fakes.notionPatches()).toHaveLength(1);
    expect(fakes.slack().some((t) => t.startsWith("⚠️ Couldn't cancel follow-up 1"))).toBe(true);
  });

  it("doesn't try once the lead is over an hour old (follow-up 1 has already gone)", async () => {
    const fakes = installFakes(withLead(90));
    await POST(hook("BOOKING_CREATED", booking()));
    expect(fakes.brevoDeletes()).toHaveLength(0);
    expect(fakes.slack().some((t) => t.includes("Couldn't cancel"))).toBe(false);
    expect(fakes.brevoSends().some((c) => String(c.body!.subject).startsWith("Follow-up 1 may still send"))).toBe(false);
  });

  it("doesn't touch it on a cancellation", async () => {
    const fakes = installFakes(withLead(20));
    await POST(hook("BOOKING_CANCELLED", booking()));
    expect(fakes.brevoDeletes()).toHaveLength(0);
  });

  it("booking email shows the call time with ET once", async () => {
    const fakes = installFakes(withLead(90));
    await POST(hook("BOOKING_CREATED", booking()));
    const alert = fakes.brevoSends().find((c) => String(c.body!.subject).startsWith("Call booked:"))!;
    expect(String(alert.body!.textContent)).toMatch(/\nCall: Wednesday, October 14, 3:00 PM ET\n/);
    expect(String(alert.body!.textContent)).not.toContain("America/New_York");
  });
});
