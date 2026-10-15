import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/lead";
import { installFakes, leadRequest, notionPage, validLead } from "./fakes";

let fakes: ReturnType<typeof installFakes>;
const NOW = new Date("2026-10-12T14:00:00.000Z");
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); vi.spyOn(console, "log").mockImplementation(() => {}); vi.spyOn(console, "warn").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const alertEmails = () => fakes.brevoSends().filter((c) => (c.body!.to as { email: string }[])[0].email === "donoven@ossmark.media");
const leadEmails = () => fakes.brevoSends().filter((c) => (c.body!.to as { email: string }[])[0].email !== "donoven@ossmark.media");

describe("/api/lead with an email", () => {
  it("schedules follow-up 1 an hour later and saves its ID and the email on the Notion row", async () => {
    fakes = installFakes();
    const res = await POST(leadRequest(validLead()));
    expect(res.status).toBe(200);

    const [a1] = leadEmails();
    expect(leadEmails()).toHaveLength(1);
    expect(a1.body).toMatchObject({
      sender: { email: "alerts@ossmark.media", name: "Donoven Hamilton" },
      to: [{ email: "owner@coolair.co" }],
      replyTo: { email: "donoven@ossmark.media" },
      subject: "Your call isn't booked yet",
      scheduledAt: "2026-10-12T15:00:00.000Z",
    });
    expect(String(a1.body!.textContent)).toContain("https://cal.com/ossmark-media-qzze1b/15min?email=owner%40coolair.co&metadata%5Blead_id%5D=lead-1234-abcd");
    expect(a1.body).not.toHaveProperty("htmlContent");

    const props = fakes.notionCreates()[0].body!.properties as Record<string, unknown>;
    expect(props["Email"]).toEqual({ email: "owner@coolair.co" });
    expect(props["Follow-up 1 ID"]).toEqual({ rich_text: [{ text: { content: expect.stringMatching(/^<msg-\d+@smtp-relay\.brevo\.com>$/) } }] });
  });

  it("adds the email to the new-lead alert, and nothing else changes in it", async () => {
    fakes = installFakes();
    await POST(leadRequest(validLead()));
    const [alert] = alertEmails();
    expect(alert.body!.subject).toBe("New lead (not booked yet): Cool Air Co");
    expect(alert.body!.sender).toEqual({ email: "alerts@ossmark.media", name: "Ossmark Media website" });
    expect(String(alert.body!.textContent).split("\n")).toEqual([
      "A new lead came in on ossmark.media. They haven't booked a call yet.",
      "",
      "Business: Cool Air Co",
      "Trade: HVAC",
      "Monthly ad spend: $2,500–$5,000",
      "Wants more of: More AC installs",
      "Phone: (856) 555-0123",
      "Email: owner@coolair.co",
      "Fit: ok",
      expect.stringMatching(/^Notion: https:\/\/www\.notion\.so\//),
    ]);
  });

  it("keeps the Slack message unchanged (no email in it)", async () => {
    fakes = installFakes();
    await POST(leadRequest(validLead()));
    expect(fakes.slack()).toHaveLength(1);
    expect(fakes.slack()[0]).toMatch(/^New lead: Cool Air Co · HVAC · \$2,500–\$5,000 · \(856\) 555-0123 · Fit: ok\n<https:\/\/www\.notion\.so\/.+\|Open in Notion>$/);
    expect(fakes.slack()[0]).not.toContain("owner@coolair.co");
  });

  it("doesn't schedule a second follow-up 1 when the same visit submits again", async () => {
    fakes = installFakes((c) => c.url.endsWith("/query")
      ? { status: 200, body: { results: [notionPage({ leadId: "lead-1234-abcd", followUp1Id: "<earlier@smtp-relay.brevo.com>" })] } }
      : undefined);
    await POST(leadRequest(validLead()));
    expect(leadEmails()).toHaveLength(0);
    expect(fakes.notionCreates()[0].body!.properties).not.toHaveProperty("Follow-up 1 ID");
  });

  it("cancels follow-up 1 when the Notion write fails, and puts the email in the ACTION NEEDED alert", async () => {
    fakes = installFakes((c) => c.method === "POST" && c.url === "http://notion.test/v1/pages" ? { status: 503, body: { code: "service_unavailable" } } : undefined);
    const res = await POST(leadRequest(validLead()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, pageId: null });
    expect(leadEmails()).toHaveLength(1);
    expect(fakes.brevoDeletes()).toHaveLength(1);
    const id = decodeURIComponent(fakes.brevoDeletes()[0].url.split("/").pop()!);
    expect(id).toMatch(/^<msg-\d+@smtp-relay\.brevo\.com>$/);
    const [alert] = alertEmails();
    expect(alert.body!.subject).toBe("ACTION NEEDED: lead not saved to Notion: Cool Air Co");
    expect(String(alert.body!.textContent)).toContain("\nPhone: (856) 555-0123\nEmail: owner@coolair.co\nTrade: HVAC\n");
  });

  it("still saves to Notion, alerts and answers 200 when Brevo can't schedule follow-up 1", async () => {
    fakes = installFakes((c) => c.url === "http://brevo.test/v3/smtp/email" && (c.body!.to as { email: string }[])[0].email !== "donoven@ossmark.media" ? { status: 500, body: {} } : undefined);
    const res = await POST(leadRequest(validLead()));
    expect(res.status).toBe(200);
    expect((await res.json()).pageId).toMatch(/^page-/);
    expect(fakes.notionCreates()[0].body!.properties).not.toHaveProperty("Follow-up 1 ID");
    expect(fakes.notionCreates()[0].body!.properties).toHaveProperty("Email");
    expect(fakes.slack()).toHaveLength(1);
    expect(alertEmails()).toHaveLength(1);
  });
});

describe("/api/lead without a usable email", () => {
  it("accepts a lead with no email (a page opened before the field existed): saved, no follow-ups", async () => {
    fakes = installFakes();
    const res = await POST(leadRequest(validLead({ email: undefined })));
    expect(res.status).toBe(200);
    expect(leadEmails()).toHaveLength(0);
    expect(fakes.notionQueries()).toHaveLength(0);
    expect(fakes.notionCreates()[0].body!.properties).not.toHaveProperty("Email");
    expect(String(alertEmails()[0].body!.textContent)).toContain("\nEmail: -\n");
  });

  it("rejects a malformed email with 400 and sends nothing", async () => {
    fakes = installFakes();
    const res = await POST(leadRequest(validLead({ email: "owner@coolair" })));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_email" });
    expect(fakes.calls).toHaveLength(0);
  });

  it.each([
    ["hidden field filled", { hp_ref: "x" }],
    ["submitted too fast", { form_ms: 500 }],
  ])("doesn't schedule follow-up 1 for a likely bot (%s)", async (_, over) => {
    fakes = installFakes();
    await POST(leadRequest(validLead(over)));
    expect(fakes.brevoSends()).toHaveLength(0);
    expect(fakes.notionCreates()).toHaveLength(0);
    expect(fakes.slack()[0]).toMatch(/^⚠️ Possible bot/);
  });
});
