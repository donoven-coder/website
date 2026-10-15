// Follow-up emails to leads who answered the qualifier but didn't book: A1 (scheduled one hour
// after the form) and A2 (the daily job, two or more days later). Copy is word for word as approved.

/** The Cal event the site books into (same as data-cal-link in src/App.tsx). */
export const CAL_EVENT_URL = "https://cal.com/ossmark-media-qzze1b/15min";

/**
 * Direct booking link: prefilled with their email and carrying their lead ID, so the booking
 * merges into the same Notion row (the webhook matches metadata.lead_id). No business name or
 * phone in the URL.
 */
export function bookingLink(email: string, leadId: string): string {
  const url = new URL(CAL_EVENT_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("metadata[lead_id]", leadId);
  return url.toString();
}

const SIGNATURE = [
  "Donoven Hamilton",
  "Founder, Ossmark Media",
  "ossmark.media · donoven@ossmark.media",
  "Booked jobs for home service businesses.",
  "",
  'Reply "stop" and I won\'t email you again.',
  "Ossmark Media · 5051 Black Horse Pike, Unit 4 #1333, Turnersville, NJ 08012",
].join("\n");

export function followUp1(business: string, link: string): { subject: string; text: string } {
  return {
    subject: "Your call isn't booked yet",
    text: [
      "Hi,",
      "",
      `You started booking a call with Ossmark Media but didn't pick a time. Here's the calendar, with your details already filled in: ${link}`,
      "",
      `It's 15 minutes. We'll look at where ${business}'s jobs come from today and whether ads can add more booked ones. If it's not a fit, I'll tell you straight.`,
      "",
      SIGNATURE,
    ].join("\n"),
  };
}

/** HVAC and Plumbing get the guarantee; every other trade gets the call offer. */
export function guaranteeLine(trade: string, business: string): string {
  return trade === "HVAC" || trade === "Plumbing"
    ? "We run Facebook and Instagram ads built to book real jobs, not just fill forms. It's backed by a guarantee: 20 booked jobs in 60 days once your ads are live, or month three is free, as long as at least $1,500 a month goes to ads and leads get a call back the same day."
    : `We run Facebook and Instagram ads built to book real jobs, not just fill forms. On a 15-minute call I'll show you what that looks like for ${business}.`;
}

export function followUp2(business: string, trade: string, link: string): { subject: string; text: string } {
  return {
    subject: "Still looking for more booked jobs?",
    text: [
      "Hi,",
      "",
      `Last note from me about getting ${business} more booked jobs.`,
      "",
      guaranteeLine(trade, business),
      "",
      `If now's not the right time, no problem. If it is, pick a time here: ${link}`,
      "",
      SIGNATURE,
    ].join("\n"),
  };
}
