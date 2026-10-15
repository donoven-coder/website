import { Book } from "@/components/sections/book";
import { SiteFooter } from "@/components/site-footer";

// /schedule: the qualifier and calendar on their own page. Logo-only header (like /booked), no nav,
// no top bar and no sticky booking bar, so there's as little as possible to click away to.
// Same stylesheet and script as the homepage (src/main.ts). Rendered to HTML at build time.
export function Schedule() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className="wrap" style={{ paddingTop: 28 }}>
        <a className="brand" href="/" aria-label="Ossmark Media home">
          <span className="brand-mark" aria-hidden="true"></span>
          <span className="brand-word" aria-hidden="true"></span>
        </a>
      </header>

      <main id="main">
        <Book />
      </main>

      <SiteFooter />
    </>
  );
}
