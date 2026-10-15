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
  attendees?: { name?: string; email?: string; phoneNumber?: string }[];
  /** Booking-form answers keyed by question identifier, as { label, value } (or a bare value). */
  responses?: Record<string, Answer>;
  /** The same answers for the custom (non-system) questions only. */
  userFieldsResponses?: Record<string, Answer>;
  additionalNotes?: string;
  description?: string;
  metadata?: Record<string, string | undefined>;
};
type Answer = { label?: string; value?: unknown } | string | undefined;

export type CalWebhook = { triggerEvent?: string; payload?: CalPayload };

const val = (x: unknown): string => {
  const v = typeof x === "object" && x !== null ? (x as { value?: unknown }).value : x;
  return typeof v === "string" ? v.trim() : "";
};

export function attendee(p: CalPayload): { name: string; email: string } {
  const a = p.attendees?.[0] ?? {};
  const r = p.responses ?? {};
  return { name: (a.name || val(r.name) || "").trim(), email: (a.email || val(r.email) || "").trim() };
}

/** A booking-form answer by question identifier (e.g. "business"), or "" if it wasn't asked or answered. */
export function answer(p: CalPayload, id: string): string {
  return val(p.responses?.[id]) || val(p.userFieldsResponses?.[id]);
}

export { formatET } from "../../src/lib/time.js";
