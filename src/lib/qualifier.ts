// Qualifier rules, shared by the page (src/) and the serverless functions (api/).
// Keep this file free of browser and Node APIs so both sides can import it.

/** Monthly ad spend (USD) below which a lead is tagged Fit = review. Never blocks a booking. */
export const FIT_REVIEW_THRESHOLD = 1500;

export const TRADES = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electrical",
  "Remodeling & general contracting",
  "Landscaping & hardscaping",
  "Pest control",
  "Exterior cleaning & pressure washing",
  "Other home service",
] as const;
export const OTHER_TRADE = "Other home service";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Budget options. The first two brackets are built from FIT_REVIEW_THRESHOLD, so moving the
 * threshold (e.g. to 1500) renames them ("Under $1,500", "$1,500–$2,500") and moves the rule.
 * `max` is the top of each bracket; anything with max below the threshold is Fit = review.
 */
export const BUDGETS: readonly { label: string; max: number }[] = [
  { label: "Not running ads yet", max: 0 },
  { label: `Under ${usd(FIT_REVIEW_THRESHOLD)}`, max: FIT_REVIEW_THRESHOLD - 1 },
  { label: `${usd(FIT_REVIEW_THRESHOLD)}–$2,500`, max: 2500 },
  { label: "$2,500–$5,000", max: 5000 },
  { label: "$5,000+", max: Number.POSITIVE_INFINITY },
];

export type Fit = "ok" | "review";

export function fitFor(trade: string, budgetLabel: string): Fit {
  const bracket = BUDGETS.find((b) => b.label === budgetLabel);
  return trade === OTHER_TRADE || (bracket !== undefined && bracket.max < FIT_REVIEW_THRESHOLD) ? "review" : "ok";
}

export const LIMITS = { business: 120, phone: 30, goal: 500 } as const;

/** Loose phone check: digits plus common separators, 7 to 15 digits. */
export function isPhone(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > LIMITS.phone || !/^[+\d\s().\-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

export const isTrade = (v: string) => (TRADES as readonly string[]).includes(v);
export const isBudget = (v: string) => BUDGETS.some((b) => b.label === v);
