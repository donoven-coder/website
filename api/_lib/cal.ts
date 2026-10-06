// Cal.com webhook helpers: signature check, payload shape, and Eastern-time formatting.
import { createHmac, timingSafeEqual } from "node:crypto";

/** X-Cal-Signature-256 is the hex HMAC-SHA256 of the raw body, keyed with the webhook secret. */
export function validSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = header.trim().replace(/^sha256=/, "");
  if (!/^[0-9a-f]+$/i.test(given) || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

export type CalEvent = "BOOKING_CREATED" | "BOOKING_RESCHEDULED" | "BOOKING_CANCELLED";
export const HANDLED: readonly string[] = ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"];

export type CalPayload = {
  uid?: string;
  startTime?: string;
  rescheduleUid?: string;
  fromReschedule?: string;
  rescheduleStartTime?: string;
  attendees?: { name?: string; email?: string }[];
  responses?: { name?: { value?: string } | string; email?: { value?: string } | string };
  metadata?: Record<string, string | undefined>;
};

export type CalWebhook = { triggerEvent?: string; payload?: CalPayload };

export function attendee(p: CalPayload): { name: string; email: string } {
  const a = p.attendees?.[0] ?? {};
  const r = p.responses ?? {};
  const val = (x: unknown) => (typeof x === "string" ? x : (x as { value?: string } | undefined)?.value ?? "");
  return { name: (a.name || val(r.name) || "").trim(), email: (a.email || val(r.email) || "").trim() };
}

export { formatET } from "../../src/lib/time.js";
