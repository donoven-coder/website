// The booking section on /schedule: the Cal.com calendar, which asks its own questions
// (behavior in src/lib/site-behaviors.ts). The heading is the page's h1 and the space above
// it is trimmed so the calendar starts near the top on a phone. Its few layout tweaks are inline
// so the stylesheet (shared with the homepage) is unchanged.
export function Book() {
  return (
    <section className="book" id="book" aria-labelledby="book-title" style={{ paddingTop: "var(--space-4)" }}>
      <div className="wrap">
        <div className="book-head" data-reveal>
          <h1 id="book-title" className="book-title">Book your free discovery call</h1>
          <p>Pick a time that works for you. Fifteen minutes on Zoom, no pressure.</p>
        </div>

        <div className="book-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 760, marginInline: "auto" }}>
          <div className="book-calendar">
            <div className="calendar-frame" data-cal data-cal-link="ossmark-media-qzze1b/15min">
              {/* Cal.com inline embed mounts here as the page loads (see site-behaviors.ts) */}
              <div className="calendar-mount" id="my-cal-inline-15min" data-cal-mount></div>
              <div className="calendar-fallback">
                <p className="calendar-fallback-title">Pick a time for your call</p>
                <p>The calendar opens in a new tab if it doesn’t load here.</p>
                <a className="btn btn-dark" href="https://cal.com/ossmark-media-qzze1b/15min" target="_blank" rel="noopener" data-cal-direct>Open the booking calendar</a>
              </div>
            </div>
            <p className="consent-note" style={{ marginTop: "var(--space-2)", textAlign: "center" }}>By continuing, you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>, and to be contacted by Ossmark Media about your request.</p>
            <p className="book-confirm" role="status" aria-live="polite" data-booked></p>
          </div>
        </div>
      </div>
    </section>
  );
}
