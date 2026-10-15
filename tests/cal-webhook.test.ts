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

/** A BOOKING_CREATED payload shaped like Cal sends it for the site's calendar: Cal's own booking
 *  questions in `responses` (custom ones repeated in `userFieldsResponses`), attribution in metadata. */
const calFormBooking = (answers: Record<string, string> = {}, over: Record<string, unknown> = {}) => {
  const a = { business: "Cool Air Co", trade: "HVAC", ad_budget: "$1,500–$2,500", notes: "More AC replacement calls in Cherry Hill", attendeePhoneNumber: "+18565550123", ...answers };
  const q = (label: string, value: string) => (value ? { label, value } : undefined);
  const custom = { business: q("Business name", a.business), trade: q("Trade", a.trade), ad_budget: q("Monthly ad spend", a.ad_budget) };
  return {
    type: "15min", title: "15 Min Meeting between Donoven Hamilton and Maria Lopez", status: "ACCEPTED",
    uid: "bk_9", bookingId: 9001, startTime: "2026-10-14T19:00:00.000Z", endTime: "2026-10-14T19:15:00.000Z",
    organizer: { name: "Donoven Hamilton", email: "donoven@ossmark.media", timeZone: "America/New_York" },
    attendees: [{ name: "Maria Lopez", email: "owner@coolair.co", timeZone: "America/New_York", language: { locale: "en" } }],
    location: "integrations:zoom",
    responses: {
      name: { label: "your_name", value: "Maria Lopez" },
      email: { label: "email_address", value: "owner@coolair.co" },
      attendeePhoneNumber: q("phone_number", a.attendeePhoneNumber),
      notes: q("What would you like more of?", a.notes),
      guests: { label: "additional_guests", value: [] },
      location: { label: "location", value: { optionValue: "", value: "integrations:zoom" } },
      ...custom,
    },
    userFieldsResponses: custom,
    additionalNotes: a.notes,
    metadata: { videoCallUrl: "https://app.cal.com/video/bk_9", utm_source: "facebook", utm_medium: "paid", utm_campaign: "hvac-oct", utm_content: "ad-3", fbclid: "fb.1.abc" },
    ...over,
  };
};
const created = (fakes: ReturnType<typeof installFakes>) => fakes.notionCreates()[0].body!.properties as Record<string, unknown>;

describe("answers from Cal's booking form", () => {
  it("creates the Notion row from a booking with Cal's answers, and the alerts show them", async () => {
    const fakes = installFakes();
    expect((await POST(hook("BOOKING_CREATED", calFormBooking()))).status).toBe(200);
    expect(fakes.notionCreates()).toHaveLength(1);
    expect(created(fakes)).toEqual({
      "Business Name": { title: [{ text: { content: "Cool Air Co" } }] },
      "Contact Name": { rich_text: [{ text: { content: "Maria Lopez" } }] },
      "Niche": { select: { name: "HVAC" } },
      "Ad budget range": { select: { name: "$1500–$2500" } },
      "Goal": { rich_text: [{ text: { content: "More AC replacement calls in Cherry Hill" } }] },
      "Fit": { select: { name: "ok" } },
      "Phone": { phone_number: "+18565550123" },
      "UTM source": { rich_text: [{ text: { content: "facebook" } }] },
      "UTM medium": { rich_text: [{ text: { content: "paid" } }] },
      "UTM campaign": { rich_text: [{ text: { content: "hvac-oct" } }] },
      "UTM content": { rich_text: [{ text: { content: "ad-3" } }] },
      "fbclid": { rich_text: [{ text: { content: "fb.1.abc" } }] },
      "Lead Source": { select: { name: "Website booking" } },
      "Consent Basis": { select: { name: "Opted In / Inquired" } },
      "Lead Status": { select: { name: "Booked" } },
      "Booked": { checkbox: true },
      "Cal booking ID": { rich_text: [{ text: { content: "bk_9" } }] },
      "Date Booked": { date: { start: "2026-10-14T19:00:00.000Z" } },
      "Email": { email: "owner@coolair.co" },
    });
    expect(fakes.slack()[0]).toMatch(/^Call booked: Cool Air Co · Wednesday, October 14, 3:00 PM ET · HVAC · \$1,500–\$2,500 · \+18565550123 · Fit: ok\n/);
    const alert = String(fakes.brevoSends().find((c) => String(c.body!.subject).startsWith("Call booked:"))!.body!.textContent).split("\n");
    expect(alert).toEqual(expect.arrayContaining(["Name: Maria Lopez", "Business: Cool Air Co", "Trade: HVAC", "Monthly ad spend: $1,500–$2,500",
      "Wants more of: More AC replacement calls in Cherry Hill", "Phone: +18565550123", "Email: owner@coolair.co", "Fit: ok"]));
  });

  it("tags under $1,500 for review and still books", async () => {
    const fakes = installFakes();
    expect((await POST(hook("BOOKING_CREATED", calFormBooking({ ad_budget: "Under $1,500" })))).status).toBe(200);
    expect(created(fakes)["Fit"]).toEqual({ select: { name: "review" } });
    expect(created(fakes)["Lead Status"]).toEqual({ select: { name: "Booked" } });
  });

  it("still handles an old-style booking with only metadata and note lines (qualifier, follow-up links)", async () => {
    const fakes = installFakes();
    const old = booking({
      metadata: { lead_id: "lead-1234-abcd", trade: "Plumbing", ad_budget: "$2,500–$5,000", goal: "More drain jobs", fit: "ok" },
      additionalNotes: "Business: Drip Fix LLC\nPhone: 609-555-0199\nTrade: Plumbing",
      responses: { name: { label: "your_name", value: "Maria Lopez" }, email: { label: "email_address", value: "owner@coolair.co" } },
    });
    expect((await POST(hook("BOOKING_CREATED", old))).status).toBe(200);
    expect(created(fakes)).toMatchObject({
      "Business Name": { title: [{ text: { content: "Drip Fix LLC" } }] },
      "Contact Name": { rich_text: [{ text: { content: "Maria Lopez" } }] },
      "Lead Source": { select: { name: "Website qualifier" } },
      "Niche": { select: { name: "Plumbing" } },
      "Ad budget range": { select: { name: "$2500–$5000" } },
      "Goal": { rich_text: [{ text: { content: "More drain jobs" } }] },
      "Fit": { select: { name: "ok" } },
      "Phone": { phone_number: "609-555-0199" },
      "Lead ID": { rich_text: [{ text: { content: "lead-1234-abcd" } }] },
    });
    expect(created(fakes)).not.toHaveProperty("UTM source");
  });

  it("creates the row with what it has when answers are missing", async () => {
    const fakes = installFakes();
    const bare = calFormBooking({ business: "", trade: "", ad_budget: "", notes: "", attendeePhoneNumber: "" }, { metadata: {}, additionalNotes: undefined });
    expect((await POST(hook("BOOKING_CREATED", bare))).status).toBe(200);
    const props = created(fakes);
    expect(props["Business Name"]).toEqual({ title: [{ text: { content: "Maria Lopez" } }] });
    expect(props["Lead Source"]).toEqual({ select: { name: "Direct booking – no qualifier" } });
    for (const k of ["Niche", "Ad budget range", "Goal", "Fit", "Phone", "Lead ID", "UTM source", "fbclid"]) expect(props).not.toHaveProperty(k);
    expect(fakes.slack()[0]).toMatch(/^Call booked: Cool Air Co · Wednesday, October 14, 3:00 PM ET · - · - · - · Fit: -\n/);
  });

  it("leaves out a trade that isn't one of the site's options, and never blocks the booking", async () => {
    const fakes = installFakes();
    expect((await POST(hook("BOOKING_CREATED", calFormBooking({ trade: "Pool cleaning" })))).status).toBe(200);
    const props = created(fakes);
    expect(props).not.toHaveProperty("Niche");
    expect(props).not.toHaveProperty("Fit");
    expect(props["Ad budget range"]).toEqual({ select: { name: "$1500–$2500" } });
    expect(props["Lead Source"]).toEqual({ select: { name: "Website booking" } });
    expect(props["Lead Status"]).toEqual({ select: { name: "Booked" } });
  });

  it.each(["Other", "other "])("maps the trade answer %j to Other home service, tagged for review", async (other) => {
    const fakes = installFakes();
    expect((await POST(hook("BOOKING_CREATED", calFormBooking({ trade: other })))).status).toBe(200);
    expect(created(fakes)["Niche"]).toEqual({ select: { name: "Other home service" } });
    expect(created(fakes)["Fit"]).toEqual({ select: { name: "review" } });
  });

  it("still drops an unknown trade such as \"Plumber\"", async () => {
    const fakes = installFakes();
    expect((await POST(hook("BOOKING_CREATED", calFormBooking({ trade: "Plumber" })))).status).toBe(200);
    expect(created(fakes)).not.toHaveProperty("Niche");
    expect(created(fakes)).not.toHaveProperty("Fit");
  });

  it.each(["HVAC", "Plumbing", "Roofing", "Electrical"])("passes the trade %j through unchanged", async (trade) => {
    const fakes = installFakes();
    await POST(hook("BOOKING_CREATED", calFormBooking({ trade })));
    expect(created(fakes)["Niche"]).toEqual({ select: { name: trade } });
    expect(created(fakes)["Fit"]).toEqual({ select: { name: "ok" } });
  });

  it("writes the answers onto an existing lead row on a new booking, but not on a reschedule", async () => {
    let fakes = installFakes(withLead(90));
    await POST(hook("BOOKING_CREATED", calFormBooking({}, { metadata: { lead_id: "lead-1234-abcd" } })));
    expect(fakes.notionCreates()).toHaveLength(0);
    expect(fakes.notionPatches()[0].body!.properties).toMatchObject({
      "Contact Name": { rich_text: [{ text: { content: "Maria Lopez" } }] }, "Niche": { select: { name: "HVAC" } },
      "Phone": { phone_number: "+18565550123" }, "Lead Status": { select: { name: "Booked" } },
    });
    vi.unstubAllGlobals();
    fakes = installFakes(withLead(90));
    await POST(hook("BOOKING_RESCHEDULED", calFormBooking({}, { uid: "bk_10", rescheduleUid: "bk_9", metadata: { lead_id: "lead-1234-abcd" } })));
    expect(Object.keys(fakes.notionPatches()[0].body!.properties as object).sort()).toEqual(["Booked", "Cal booking ID", "Date Booked", "Email", "Lead Status"]);
  });
});
