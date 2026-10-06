// Ad attribution: utm_* and fbclid from the first landing URL of the visit, kept in
// sessionStorage so they survive in-page navigation and are sent with the lead.

const KEY = "ossmark:attribution";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>>;

/** Call once on page load. Only the first landing of the session is recorded. */
export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const q = new URLSearchParams(location.search);
    const found: Attribution = {};
    PARAMS.forEach((p) => { const v = q.get(p); if (v) found[p] = v.slice(0, 200); });
    sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch { /* storage blocked: attribution is optional */ }
}

export function readAttribution(): Attribution {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Attribution; } catch { return {}; }
}
