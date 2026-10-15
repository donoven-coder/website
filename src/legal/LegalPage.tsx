import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

// Layout for /privacy and /terms: the logo-only header used on /booked (plus a "Book a call" button), one narrow column of
// text, and the site footer. Rendered to HTML at build time (scripts/prerender.mjs).

/** `effective` is shown as "Effective …" at the top. Each page has its own; update it when that page's text changes. */
export function LegalPage({ title, effective, children }: { title: string; effective: string; children: ReactNode }) {
  return (
    <>
      <header className="bk-top">
        <a className="bk-brand" href="/" aria-label="Ossmark Media home">
          <span className="bk-mark" aria-hidden="true"></span>
          <span className="bk-word" aria-hidden="true"></span>
        </a>
        <a className="legal-book" href="/schedule">Book a call</a>
      </header>

      <main className="legal">
        <h1 className="legal-title">{title}</h1>
        <p className="legal-sub">Effective {effective}</p>
        {children}
      </main>

      <SiteFooter />
    </>
  );
}
