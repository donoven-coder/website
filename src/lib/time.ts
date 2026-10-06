// Formats a booking time in Eastern time, shared by /booked and the /api alerts.

/** "Thursday, October 9, 2:30 PM ET" (America/New_York), or "" if there's no valid time. */
export function formatET(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(d);
  return `${day}, ${time} ET`;
}
