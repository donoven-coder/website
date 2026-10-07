// Small helpers shared by the /api functions. Relative imports use ".js" so they resolve
// after Vercel compiles each TypeScript file (the project is an ES module package).

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Environment variable, trimmed, with one pair of surrounding quotes removed (a common paste slip). */
export const env = (name: string, fallback = ""): string => {
  const v = (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/s, "$2").trim();
  return v || fallback;
};

/** fetch that gives up after `ms`, so one slow service can't hold up the others. */
export function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

/** Origins allowed to post leads: the live domain plus anything in ALLOWED_ORIGINS (comma-separated). */
export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set(["https://ossmark.media", "https://www.ossmark.media"]);
  env("ALLOWED_ORIGINS").split(",").map((s) => s.trim()).filter(Boolean).forEach((o) => allowed.add(o));
  return allowed.has(origin);
}

export const clientIp = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

/**
 * Best-effort rate limit: 5 requests per 10 minutes per IP, counted per function instance.
 * Vercel runs several short-lived instances, so this slows bursts rather than enforcing a hard cap.
 */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > limit;
}

/** Reads the body as text with a size cap (bytes). Returns null if it's too large. */
export async function readBody(request: Request, maxBytes = 10_000): Promise<string | null> {
  const text = await request.text();
  return new TextEncoder().encode(text).length > maxBytes ? null : text;
}
