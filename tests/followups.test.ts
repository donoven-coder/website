import { describe, expect, it } from "vitest";
import { bookingLink, followUp1, followUp2 } from "../api/_lib/followups";
import { isEmail } from "../src/lib/qualifier";

const LINK = "https://cal.com/ossmark-media-qzze1b/15min?email=owner%40coolair.co&metadata%5Blead_id%5D=lead-1234-abcd";
const SIGNATURE = `Donoven Hamilton
Founder, Ossmark Media
ossmark.media · donoven@ossmark.media
Booked jobs for home service businesses.

Reply "stop" and I won't email you again.
Ossmark Media · 5051 Black Horse Pike, Unit 4 #1333, Turnersville, NJ 08012`;

describe("booking link", () => {
  it("goes to the Cal event with their email and lead ID, and nothing else", () => {
    const link = bookingLink("owner@coolair.co", "lead-1234-abcd");
    expect(link).toBe(LINK);
    const u = new URL(link);
    expect(u.origin + u.pathname).toBe("https://cal.com/ossmark-media-qzze1b/15min");
    expect([...u.searchParams.keys()]).toEqual(["email", "metadata[lead_id]"]);
    expect(u.searchParams.get("email")).toBe("owner@coolair.co");
    expect(u.searchParams.get("metadata[lead_id]")).toBe("lead-1234-abcd");
  });
});

describe("follow-up 1 (A1)", () => {
  it("is the approved copy, word for word", () => {
    const a1 = followUp1("Cool Air Co", LINK);
    expect(a1.subject).toBe("Your call isn't booked yet");
    expect(a1.text).toBe(`Hi,

You started booking a call with Ossmark Media but didn't pick a time. Here's the calendar, with your details already filled in: ${LINK}

It's 15 minutes. We'll look at where Cool Air Co's jobs come from today and whether ads can add more booked ones. If it's not a fit, I'll tell you straight.

${SIGNATURE}`);
  });
});

describe("follow-up 2 (A2)", () => {
  const GUARANTEE = "We run Facebook and Instagram ads built to book real jobs, not just fill forms. It's backed by a guarantee: 20 booked jobs in 60 days once your ads are live, or month three is free, as long as at least $1,500 a month goes to ads and leads get a call back the same day.";
  const a2Text = (line: string) => `Hi,

Last note from me about getting Cool Air Co more booked jobs.

${line}

If now's not the right time, no problem. If it is, pick a time here: ${LINK}

${SIGNATURE}`;

  it.each(["HVAC", "Plumbing"])("%s gets the guarantee line", (trade) => {
    const a2 = followUp2("Cool Air Co", trade, LINK);
    expect(a2.subject).toBe("Still looking for more booked jobs?");
    expect(a2.text).toBe(a2Text(GUARANTEE));
  });

  it.each(["Roofing", "Electrical", "Other home service", ""])("%j gets the call offer instead", (trade) => {
    expect(followUp2("Cool Air Co", trade, LINK).text).toBe(a2Text(
      "We run Facebook and Instagram ads built to book real jobs, not just fill forms. On a 15-minute call I'll show you what that looks like for Cool Air Co.",
    ));
  });

  it("signs as Donoven Hamilton, not Hamilton-Conley", () => {
    expect(followUp2("X", "HVAC", LINK).text).not.toMatch(/Conley/);
    expect(followUp1("X", LINK).text).not.toMatch(/Conley/);
  });
});

describe("email format check", () => {
  it.each(["owner@coolair.co", "a.b+c@sub.example.com", " pad@ex.io "])("accepts %j", (v) => expect(isEmail(v)).toBe(true));
  it.each(["", "owner", "owner@", "@coolair.co", "owner@coolair", "own er@coolair.co", "owner@cool air.co", `${"a".repeat(250)}@x.co`])(
    "rejects %j", (v) => expect(isEmail(v)).toBe(false));
});
