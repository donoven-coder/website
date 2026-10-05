/* ==========================================================================
   Meta Pixel events (base code + PageView live in index.html).

   Every event gets an eventID. When a Conversions API endpoint is added, the
   server sends the same event_name + event_id and Meta de-duplicates the pair,
   so nothing is counted twice. To switch it on:
     1. Add a Vercel function at api/meta-capi.ts that POSTs to
        https://graph.facebook.com/v21.0/1606518160921650/events using a
        META_CAPI_TOKEN environment variable (never put the token in this file).
     2. Set CAPI_ENDPOINT below to "/api/meta-capi".
   ========================================================================== */

export const META_PIXEL_ID = "1606518160921650";

// Empty until the server function exists; the browser pixel works on its own.
const CAPI_ENDPOINT = "";

type Params = Record<string, string | number>;
type Fbq = (...args: unknown[]) => void;

function eventId() {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch { /* older browsers fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cookie(name: string) {
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

// Future Conversions API mirror of a browser event (same event_id for de-duplication).
function sendToServer(eventName: string, id: string, params: Params) {
  if (!CAPI_ENDPOINT) return;
  const body = JSON.stringify({
    event_name: eventName,
    event_id: id,
    event_source_url: location.href,
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc"),
    custom_data: params,
  });
  try {
    if (!navigator.sendBeacon?.(CAPI_ENDPOINT, new Blob([body], { type: "application/json" }))) {
      void fetch(CAPI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch { /* tracking must never break the page */ }
}

function track(eventName: string, params: Params) {
  const id = eventId();
  try {
    (window as unknown as { fbq?: Fbq }).fbq?.("track", eventName, params, { eventID: id });
  } catch { /* blocked or not loaded */ }
  sendToServer(eventName, id, params);
  return id;
}

export type QualifierAnswers = {
  trade: string;
  ad_budget: string;
  goal: string;
  /** "good" or "review" (Other home service, or under $1,000 a month in ads) */
  fit: string;
};

// The free-text goal stays out of the pixel; it goes to Cal with the booking instead.
const toParams = (a: QualifierAnswers): Params => ({
  content_name: "Discovery call",
  trade: a.trade,
  ad_budget: a.ad_budget,
  fit: a.fit,
});

/** Qualifier submitted: the visitor is about to see open times. */
export const trackLead = (a: QualifierAnswers) => track("Lead", toParams(a));

/** A discovery call was actually booked (fired from Cal.com's booking-success event). */
export const trackSchedule = (a: QualifierAnswers | null) =>
  track("Schedule", a ? toParams(a) : { content_name: "Discovery call" });
