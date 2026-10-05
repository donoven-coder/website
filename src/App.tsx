import { useEffect } from "react";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { initSite } from "@/lib/site-behaviors";

export default function App() {
  // Map, scroll reveals, sticky booking bar, booking qualifier + Cal.com embed and mobile menu.
  // A failure here must never take the page down: React would unmount everything on an
  // uncaught effect error. Content stays readable and the failsafe in index.html reveals it.
  useEffect(() => {
    try {
      return initSite();
    } catch (err) {
      console.error("Page behaviors failed to start", err);
    }
  }, []);

  return (
    <>
        <a className="skip-link" href="#main">Skip to main content</a>

        <aside className="topbar" aria-label="Booking notice">
          <p>Free 15-minute discovery calls, booking now. <a href="#book">Pick a time</a></p>
        </aside>

        <header className="site-header" data-header>
          <div className="wrap header-inner">
            <a className="brand" href="#top" aria-label="Ossmark Media home">
              <span className="brand-mark" aria-hidden="true"></span>
              <span className="brand-word" aria-hidden="true"></span>
            </a>

            <button className="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
              <span className="nav-toggle-bars" aria-hidden="true"></span>
              <span className="nav-toggle-label">Menu</span>
            </button>

            <nav id="site-nav" className="site-nav" aria-label="Main" data-nav>
              <ul>
                <li><a href="#services">Services</a></li>
                <li><a href="#founder">About</a></li>
                <li><a href="#process">How it works</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
              <a className="btn btn-dark btn-sm" href="#book">Book a call</a>
            </nav>
          </div>
        </header>

        <main id="main">
          <Hero />

          {/* PLATFORMS */}
          <section className="platforms" aria-label="Ad platforms we run">
            <div className="wrap platforms-inner">
              <p className="platforms-label">We run ads on</p>
              <ul className="platform-list">
                <li>Facebook</li>
                <li>Instagram</li>
                <li>Google</li>
              </ul>
            </div>
          </section>

          {/* STANCE */}
          <section className="stance" aria-labelledby="stance-title">
            <div className="wrap">
              <h2 id="stance-title" className="stance-text">
                Most contractors have already tried ads. Boosted posts, a guy who ‘does marketing,’ a monthly report full of clicks and reach.
                <span className="stance-turn">None of it tells you how many jobs you booked. That’s the number we build everything around.</span>
              </h2>
            </div>
          </section>

          <Services />

          {/* FOUNDER */}
          <section className="founder" id="founder" aria-labelledby="founder-title">
            <div className="wrap founder-grid">
              {/* REPLACE: founder photo. Use a natural, well-lit photo (portrait 4:5, at least 1000px wide), saved as assets/founder.jpg */}
              <figure className="founder-photo" data-reveal data-replace="Founder photo">
                <span className="founder-photo-mark" aria-hidden="true"></span>
                <figcaption className="visually-hidden">Photo of Donoven, founder of Ossmark Media</figcaption>
              </figure>
              <div className="founder-copy" data-reveal>
                <h2 id="founder-title" className="section-title">Meet Donoven</h2>
                <p className="founder-role">Founder, Ossmark Media</p>
                {/* REPLACE: rewrite in your own words (where you're from, why you started, what you believe about ads) */}
                <div className="founder-story" data-replace="Founder story">
                  <p>I started Ossmark Media because I kept watching good home service businesses burn money on ads that looked busy and booked nobody.</p>
                  <p>When you work with us, you work with me. I plan your campaigns, I read your numbers every week, and I’m the one on the call. No account managers passing you around, and no 12-month contract.</p>
                </div>
                <a className="btn btn-dark" href="#book" data-cta="founder">Talk with Donoven</a>
              </div>
            </div>
          </section>

          {/* PROCESS (a real sequence, so it is numbered) */}
          <section className="process" id="process" aria-labelledby="process-title">
            <div className="wrap">
              <div className="section-head" data-reveal>
                <h2 id="process-title" className="section-title">How it works</h2>
                <p className="section-sub">From first call to campaigns that scale, with nothing hidden along the way.</p>
              </div>

              <ol className="steps" data-steps>
                <li className="step">
                  <span className="step-num" aria-hidden="true">1</span>
                  <h3>Discovery call</h3>
                  <p>A free 15-minute call about your business, your customers and what you’ve tried so far.</p>
                </li>
                <li className="step">
                  <span className="step-num" aria-hidden="true">2</span>
                  <h3>Plan &amp; build</h3>
                  <p>We map your offer, target towns and budget, then build the ads, pages and tracking.</p>
                </li>
                <li className="step">
                  <span className="step-num" aria-hidden="true">3</span>
                  <h3>Launch</h3>
                  {/* REPLACE: confirm the launch timeline you can commit to */}
                  <p>Campaigns go live within <span data-replace="Launch timeline">7 days</span> of kickoff.</p>
                </li>
                <li className="step">
                  <span className="step-num" aria-hidden="true">4</span>
                  <h3>Report &amp; scale</h3>
                  <p>A plain-English report every week. We cut what isn’t paying off and scale what is.</p>
                </li>
              </ol>
            </div>
          </section>

          {/* REPORT + OFFER (honest: layout only, no invented results) */}
          <section className="report" aria-labelledby="report-title">
            <div className="wrap report-grid">
              <div className="report-copy" data-reveal>
                <h2 id="report-title" className="section-title">The report you’ll get every Monday</h2>
                <p className="section-sub">No 40-page decks or vanity metrics. Five numbers that tell you whether your ads are making money, readable on your phone in under a minute.</p>

                <div className="offer">
                  <p className="offer-label">Our guarantee</p>
                  <p className="offer-title">20 booked jobs in 60 days, or month 3 is free.</p>
                  <p>If our campaigns don’t put 20 booked jobs on your calendar in your first 60 days, you don’t pay for month 3. We keep working either way.</p>
                  <a className="offer-link" href="#book" data-cta="guarantee">See if you qualify</a>
                </div>
              </div>
              <div className="report-card" role="group" aria-labelledby="report-card-title" data-reveal>
                <div className="report-card-head">
                  <p id="report-card-title" className="report-card-title">Weekly report</p>
                  <p className="report-card-tag">Sample layout</p>
                </div>
                <dl className="report-metrics">
                  <div><dt>Ad spend</dt><dd>$ &mdash;</dd></div>
                  <div><dt>New leads</dt><dd>&mdash;</dd></div>
                  <div><dt>Cost per lead</dt><dd>$ &mdash;</dd></div>
                  <div><dt>Booked jobs</dt><dd>&mdash;</dd></div>
                  <div className="is-key"><dt>Cost per booked job</dt><dd>$ &mdash;</dd></div>
                </dl>
                <p className="report-note">Your real numbers appear here from week one.</p>
              </div>
            </div>
          </section>

          {/* LOCAL */}
          <section className="local" id="local" aria-labelledby="local-title">
            <div className="wrap local-grid">
              <h2 id="local-title" className="local-title" data-reveal>We know how South Jersey hires a contractor.</h2>
              <div className="local-body" data-reveal>
                <p>
                  When the AC dies in July or a pipe bursts in January, homeowners here don’t shop around for long. They call whoever shows up first and looks legit.
                  We build your ads around those moments, town by town from Burlington to Cape May, so the business that shows up first is yours.
                </p>
                <p className="local-industries-label">Trades we work with</p>
                <ul className="chips">
                  <li>HVAC</li>
                  <li>Plumbing</li>
                  <li>Roofing</li>
                  <li>Electrical</li>
                  <li>Remodeling &amp; general contracting</li>
                  <li>Landscaping &amp; hardscaping</li>
                  <li>Pest control</li>
                  <li>Exterior cleaning &amp; pressure washing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* PROMISES */}
          <section className="promises" aria-labelledby="promises-title">
            <div className="wrap">
              <h2 id="promises-title" className="section-title" data-reveal>How we treat clients</h2>
              {/* REPLACE: confirm each promise matches your actual terms before launch */}
              <ul className="promise-list" data-replace="Confirm client promises">
                <li>
                  <h3>Month-to-month</h3>
                  <p>No long contracts. We keep your business by getting results.</p>
                </li>
                <li>
                  <h3>You own everything</h3>
                  <p>Ad accounts, pixels, pages and data stay in your name, always.</p>
                </li>
                <li>
                  <h3>Plain-English reporting</h3>
                  <p>Every week you’ll know what you spent and what you got back.</p>
                </li>
                <li>
                  <h3>A real person answers</h3>
                  <p>Questions get a reply from Donoven within one business day.</p>
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="faq" id="faq" aria-labelledby="faq-title">
            <div className="wrap faq-grid">
              <div data-reveal>
                <h2 id="faq-title" className="section-title">Questions, answered</h2>
                <p className="section-sub faq-sub">Still unsure? Ask on the call. It’s 15 minutes and free.</p>
              </div>
              <div className="faq-list">
                <details>
                  <summary>What happens on the discovery call?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>We spend 15 minutes on Zoom talking about your business, who your best customers are and what you’ve tried with ads so far. You’ll leave with a clear idea of what we’d run and what it would cost. If we’re not a fit, we’ll tell you.</p>
                </details>
                <details>
                  <summary>How much should I spend on ads?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>It depends on your service area, your average job value, and how much new work your crew can take on. We’ll recommend a starting budget on the call, built around what it takes to hit your booking goals, not a number pulled from a chart.</p>
                </details>
                <details>
                  <summary>What does it cost to work with you?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>It depends on your trade, your service area, and how fast you want to grow. We’ll map it out on the call and give you a straight answer before you commit to anything.</p>
                </details>
                <details>
                  <summary>How fast will I see results?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>Campaigns go live within 7 days of kickoff. The first few weeks are about finding which ads and offers book jobs in your area, then we put more behind what’s working. That’s why our guarantee covers your first 60 days.</p>
                </details>
                <details>
                  <summary>Do I need a new website?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>Usually not. We build focused landing pages for your ads, so your main website can stay as it is.</p>
                </details>
                <details>
                  <summary>Which areas do you serve?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>All of South Jersey: Camden, Burlington, Gloucester, Atlantic, Cape May, Cumberland and Salem counties, plus businesses serving the Philadelphia suburbs.</p>
                </details>
                <details>
                  <summary>Will I be locked into a contract?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>No. We work month-to-month, and if you leave, your ad accounts and data stay with you.</p>
                </details>
              </div>
            </div>
          </section>

          {/* BOOK */}
          <section className="book" id="book" aria-labelledby="book-title">
            <div className="wrap">
              <div className="book-head" data-reveal>
                <h2 id="book-title" className="book-title">Book your free discovery call</h2>
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
                  <p className="book-direct">
                    Prefer email? <span className="book-direct-address">donoven@ossmark.media</span>
                    <button type="button" className="copy-btn copy-btn-light" data-copy="donoven@ossmark.media" aria-label="Copy email address donoven@ossmark.media">
                      <span data-copy-label>Copy</span>
                    </button>
                  </p>
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
                        <option>HVAC</option>
                        <option>Plumbing</option>
                        <option>Roofing</option>
                        <option>Electrical</option>
                        <option>Remodeling &amp; general contracting</option>
                        <option>Landscaping &amp; hardscaping</option>
                        <option>Pest control</option>
                        <option>Exterior cleaning &amp; pressure washing</option>
                        <option>Other home service</option>
                      </select>
                      <p className="field-error" id="q-trade-err" aria-live="polite"></p>
                    </div>
                    <div className="field">
                      <label htmlFor="q-budget">What are you putting into ads each month? <span className="req" aria-hidden="true">*</span></label>
                      <select id="q-budget" name="ad_budget" required aria-describedby="q-budget-err" defaultValue="">
                        <option value="" disabled>Choose one</option>
                        <option>Not running ads yet</option>
                        <option>Under $1,000</option>
                        <option>$1,000–$2,500</option>
                        <option>$2,500–$5,000</option>
                        <option>$5,000+</option>
                      </select>
                      <p className="field-error" id="q-budget-err" aria-live="polite"></p>
                    </div>
                    <div className="field">
                      <label htmlFor="q-goal">What would you like more of?</label>
                      <input id="q-goal" name="goal" type="text" placeholder="More AC replacement calls in Cherry Hill" />
                    </div>
                    <button className="btn btn-dark btn-block" type="submit">Show open times</button>
                    <p className="visually-hidden" role="status" aria-live="polite" data-qualify-status></p>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="closer" aria-labelledby="closer-title">
            <div className="wrap closer-inner">
              <span className="closer-logo" aria-hidden="true" data-closer-logo></span>
              <h2 id="closer-title" className="closer-title">Ready to fill your calendar?</h2>
              <a className="btn btn-sky btn-lg" href="#book" data-cta="closer">Book your free discovery call</a>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="wrap footer-grid">
            <div>
              <span className="footer-word" role="img" aria-label="Ossmark Media"></span>
              <p className="footer-line">Facebook, Instagram and Google ads for South Jersey businesses.</p>
            </div>
            <div>
              <p className="footer-head">Service area</p>
              <p className="footer-line">Camden, Burlington, Gloucester, Atlantic, Cape May, Cumberland and Salem counties</p>
            </div>
            <div>
              <p className="footer-head">Contact</p>
              {/* REPLACE: add a phone number if you want one listed */}
              <p className="footer-line footer-email">
                  <span className="footer-email-address">donoven@ossmark.media</span>
                  <button type="button" className="copy-btn" data-copy="donoven@ossmark.media" aria-label="Copy email address donoven@ossmark.media">
                    <span data-copy-label>Copy</span>
                  </button>
                </p>
                <p className="footer-line"><a href="#book">Book a discovery call</a></p>
            </div>
          </div>
          <div className="wrap footer-base">
            <p>&copy; <span data-year>2026</span> Ossmark Media. All rights reserved.</p>
            <a href="#top">Back to top</a>
          </div>
        </footer>

        {/* Mobile: persistent booking bar, hidden while the booking section is on screen */}
        <div className="sticky-cta" data-sticky-cta aria-hidden="true">
          <a className="btn btn-dark btn-block" href="#book" tabIndex={-1} data-cta="sticky">Book your free discovery call</a>
        </div>
    </>
  );
}
