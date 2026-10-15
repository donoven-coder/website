import { BUDGETS, LIMITS, TRADES } from "@/lib/qualifier";

// The booking section: qualifier + Cal.com calendar (behavior in src/lib/site-behaviors.ts).
// Moved as-is from the homepage to /schedule; there the heading is the page's h1 and the
// space above it is trimmed so the questions start near the top on a phone.
export function Book() {
  return (
    <section className="book" id="book" aria-labelledby="book-title" style={{ paddingTop: "var(--space-4)" }}>
      <div className="wrap">
        <div className="book-head" data-reveal>
          <h1 id="book-title" className="book-title">Book your free discovery call</h1>
          <p>A few quick questions, then pick a time. Fifteen minutes on Zoom, no pressure.</p>
        </div>

        <div className="book-grid">
          <div className="book-calendar">
            <div className="calendar-frame is-locked" data-cal data-cal-link="ossmark-media-qzze1b/15min">
              {/* Cal.com inline embed mounts here once the qualifier is answered (see site-behaviors.ts) */}
              <div className="calendar-mount" id="my-cal-inline-15min" data-cal-mount></div>
              <div className="calendar-lock" data-cal-lock>
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="4.5" width="13" height="12" rx="2"/><path d="M3.5 8.5h13M7 2.8v3.4M13 2.8v3.4"/></svg>
                <p>Answer a few quick questions to see open times.</p>
              </div>
              <div className="calendar-fallback">
                <p className="calendar-fallback-title">Pick a time for your call</p>
                <p>The calendar opens in a new tab if it doesn’t load here.</p>
                <a className="btn btn-dark" href="https://cal.com/ossmark-media-qzze1b/15min" target="_blank" rel="noopener" data-cal-direct>Open the booking calendar</a>
              </div>
            </div>
            <p className="book-confirm" role="status" aria-live="polite" data-booked></p>
          </div>

          <div className="book-message book-qualify">
            <h3 className="book-message-title">First, a few quick questions.</h3>
            <p className="book-message-sub">So we spend the call on your business, not the basics.</p>
            <form className="contact-form" noValidate data-qualify>
              <div className="field">
                <label htmlFor="q-trade">What’s your trade? <span className="req" aria-hidden="true">*</span></label>
                <select id="q-trade" name="trade" required aria-describedby="q-trade-err" defaultValue="">
                  <option value="" disabled>Choose one</option>
                  {TRADES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <p className="field-error" id="q-trade-err" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="q-budget">What are you putting into ads each month? <span className="req" aria-hidden="true">*</span></label>
                <select id="q-budget" name="ad_budget" required aria-describedby="q-budget-err" defaultValue="">
                  <option value="" disabled>Choose one</option>
                  {BUDGETS.map((b) => <option key={b.label}>{b.label}</option>)}
                </select>
                <p className="field-error" id="q-budget-err" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="q-business">Business name <span className="req" aria-hidden="true">*</span></label>
                <input id="q-business" name="business" type="text" autoComplete="organization" required maxLength={LIMITS.business} aria-describedby="q-business-err" />
                <p className="field-error" id="q-business-err" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="q-phone">Best phone number <span className="req" aria-hidden="true">*</span></label>
                <input id="q-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={LIMITS.phone} aria-describedby="q-phone-err" />
                <p className="field-error" id="q-phone-err" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="q-email">Email <span className="req" aria-hidden="true">*</span></label>
                <input id="q-email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={LIMITS.email} aria-describedby="q-email-err" />
                <p className="field-error" id="q-email-err" aria-live="polite"></p>
              </div>
              <div className="field">
                <label htmlFor="q-goal">What would you like more of?</label>
                <input id="q-goal" name="goal" type="text" maxLength={LIMITS.goal} placeholder="More AC replacement calls in Cherry Hill" />
              </div>
              {/* Spam trap. Never shown (display: none, so browser and password-manager autofill skip
                  it) and given a name no autofill recognizes. Filled ones are flagged, not dropped. */}
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="q-hp-ref">Leave blank</label>
                <input id="q-hp-ref" name="hp_ref" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <button className="btn btn-dark btn-block" type="submit">Show open times</button>
              <p className="consent-note">By continuing, you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>, and to be contacted by Ossmark Media about your request.</p>
              <p className="visually-hidden" role="status" aria-live="polite" data-qualify-status></p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
