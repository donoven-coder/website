import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

// Layout for /privacy and /terms: the logo-only header used on /booked, one narrow column of
// text, and the site footer. Rendered to HTML at build time (scripts/prerender.mjs).

/** Shown as "Effective …" at the top of both pages. Update it when the text changes. */
export const EFFECTIVE_DATE = "October 9, 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="bk-top">
        <a className="bk-brand" href="/" aria-label="Ossmark Media home">
          <span className="bk-mark" aria-hidden="true"></span>
          <span className="bk-word" aria-hidden="true"></span>
        </a>
      </header>

      <main className="legal">
        <h1 className="legal-title">{title}</h1>
        <p className="legal-sub">Effective {EFFECTIVE_DATE}</p>
        {children}
      </main>

      <SiteFooter />
    </>
  );
}
