// The homepage footer (src/App.tsx), for the other pages: /privacy, /terms and /booked.
// Same markup and styling (styles: src/styles/footer.css; copy button and year: src/lib/footer.ts).
// Keep it in step with the footer in App.tsx. The only difference is that the booking link
// points to the homepage section ("/#book") instead of "#book".
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <span className="footer-word" role="img" aria-label="Ossmark Media"></span>
          <p className="footer-line">Facebook, Instagram and Google ads for home service businesses.</p>
        </div>
        <div>
          <p className="footer-head">Service area</p>
          <p className="footer-line">Camden, Burlington, Gloucester, Atlantic, Cape May, Cumberland and Salem counties</p>
        </div>
        <div>
          <p className="footer-head">Contact</p>
          <p className="footer-line footer-email">
            <span className="footer-email-address">donoven@ossmark.media</span>
            <button type="button" className="copy-btn" data-copy="donoven@ossmark.media" aria-label="Copy email address donoven@ossmark.media">
              <span data-copy-label>Copy</span>
            </button>
          </p>
          <p className="footer-line"><a href="/#book">Book a discovery call</a></p>
          <p className="footer-line"><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
        </div>
      </div>
      <div className="wrap footer-base">
        <p>&copy; <span data-year>2026</span> Ossmark Media. All rights reserved.</p>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
