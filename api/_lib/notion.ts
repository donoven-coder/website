// Notion access for the Leads data source (API version 2025-09-03, which addresses data
// sources directly). Property names below match the Leads schema; change them here only.
import { env, fetchWithTimeout } from "./http.js";

export const PROPS = {
  business: "Business Name", // title
  niche: "Niche", // select: new trades are added as options automatically
  phone: "Phone", // phone_number
  email: "Email", // email
  source: "Lead Source", // select
  consent: "Consent Basis", // select
  booked: "Booked", // checkbox
  status: "Lead Status", // select (your pipeline)
  callTime: "Date Booked", // date: the scheduled call
  budget: "Ad budget range", // select
  goal: "Goal", // text
  fit: "Fit", // select: ok / review
  leadId: "Lead ID", // text
  bookingId: "Cal booking ID", // text
  utmSource: "UTM source",
  utmMedium: "UTM medium",
  utmCampaign: "UTM campaign",
  utmContent: "UTM content",
  fbclid: "fbclid",
} as const;

// Notion select options can't contain commas, so these use a dash.
export const STATUS = {
  qualified: "Qualified – not booked",
  booked: "Booked",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
} as const;
export const SOURCE = { qualifier: "Website qualifier", direct: "Direct booking – no qualifier" } as const;
export const CONSENT_OPTED_IN = "Opted In / Inquired";

const API = () => env("NOTION_API_BASE", "https://api.notion.com");
const DATA_SOURCE = () => env("NOTION_LEADS_DATA_SOURCE_ID", "266b9e70-03ea-8265-97af-07de7848d68d");

async function notion(path: string, method: string, body?: unknown): Promise<Record<string, unknown>> {
  const token = env("NOTION_TOKEN");
  if (!token) throw new Error("NOTION_TOKEN not set");
  const res = await fetchWithTimeout(`${API()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2025-09-03", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }, 6000);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Notion ${method} ${path.split("/")[2] ?? path} → ${res.status} ${String(data.code ?? "")}`);
  return data;
}

// ---- property value builders --------------------------------------------------------
const text = (v: string) => ({ rich_text: v ? [{ text: { content: v.slice(0, 1900) } }] : [] });
const title = (v: string) => ({ title: [{ text: { content: v.slice(0, 200) || "Untitled lead" } }] });
const select = (v: string) => ({ select: v ? { name: v.replace(/,/g, "").slice(0, 100) } : null });
const phone = (v: string) => ({ phone_number: v || null });
const email = (v: string) => ({ email: v || null });
const date = (iso: string) => ({ date: iso ? { start: iso } : null });
const checkbox = (v: boolean) => ({ checkbox: v });

export const prop = { text, title, select, phone, email, date, checkbox };
export type Props = Record<string, unknown>;

// ---- reading a lead back --------------------------------------------------------------
export type Lead = {
  id: string; url: string; business: string; phone: string; niche: string; budget: string;
  goal: string; fit: string; email: string; status: string; bookingId: string; leadId: string; callTime: string;
};

type P = Record<string, { type?: string; [k: string]: unknown }>;
const plain = (arr: unknown) => (Array.isArray(arr) ? arr.map((t: { plain_text?: string }) => t.plain_text ?? "").join("") : "");
function readLead(page: Record<string, unknown>): Lead {
  const p = (page.properties ?? {}) as P;
  const get = (name: string): string => {
    const v = p[name];
    if (!v) return "";
    switch (v.type) {
      case "title": return plain(v.title);
      case "rich_text": return plain(v.rich_text);
      case "select": return (v.select as { name?: string } | null)?.name ?? "";
      case "phone_number": return (v.phone_number as string | null) ?? "";
      case "email": return (v.email as string | null) ?? "";
      case "date": return (v.date as { start?: string } | null)?.start ?? "";
      default: return "";
    }
  };
  return {
    id: String(page.id), url: String(page.url ?? ""),
    business: get(PROPS.business), phone: get(PROPS.phone), niche: get(PROPS.niche), budget: get(PROPS.budget),
    goal: get(PROPS.goal), fit: get(PROPS.fit), email: get(PROPS.email), status: get(PROPS.status),
    bookingId: get(PROPS.bookingId), leadId: get(PROPS.leadId), callTime: get(PROPS.callTime),
  };
}

// ---- operations -------------------------------------------------------------------------
export async function createLead(properties: Props): Promise<Lead> {
  const page = await notion("/v1/pages", "POST", { parent: { type: "data_source_id", data_source_id: DATA_SOURCE() }, properties });
  return readLead(page);
}

export async function updateLead(id: string, properties: Props): Promise<Lead> {
  return readLead(await notion(`/v1/pages/${id}`, "PATCH", { properties }));
}

/** First lead whose text property equals `value`, or null. */
export async function findLeadBy(property: string, value: string): Promise<Lead | null> {
  if (!value) return null;
  const res = await notion(`/v1/data_sources/${DATA_SOURCE()}/query`, "POST", {
    filter: { property, rich_text: { equals: value } },
    page_size: 1,
  });
  const first = (res.results as Record<string, unknown>[] | undefined)?.[0];
  return first ? readLead(first) : null;
}
