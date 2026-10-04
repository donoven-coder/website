import { useEffect } from "react";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { initSite } from "@/lib/site-behaviors";

export default function App() {
  // Map, scroll reveals, sticky booking bar, Cal.com embed, mobile menu and form validation.
  useEffect(() => initSite(), []);

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
                <li>Google Search</li>
              </ul>
            </div>
          </section>

          {/* STANCE */}
          <section className="stance" aria-labelledby="stance-title">
            <div className="wrap">
              <h2 id="stance-title" className="stance-text" data-reveal>
                Most local ad budgets vanish into boosted posts, broad targeting and reports nobody reads.
                <span className="stance-turn">We judge every campaign by how many customers it booked.</span>
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
                  <p>I started Ossmark Media because I kept watching good South Jersey businesses burn money on ads that looked busy and booked nobody.</p>
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

                {/*
                  REPLACE (optional): founding-client offer. Strong for a new agency with no case studies yet.
                  Edit the terms or delete this block. Once you have results, swap it for a case study.
                */}
                <div className="offer" data-replace="Founding client offer (optional)">
                  <p className="offer-title">Founding client offer</p>
                  <p>Our first 5 South Jersey clients get their setup fee waived and a locked-in rate for 12 months.</p>
                  <a className="offer-link" href="#book" data-cta="offer">Claim a spot on a call</a>
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
                  <div><dt>Booked customers</dt><dd>&mdash;</dd></div>
                  <div className="is-key"><dt>Cost per booked customer</dt><dd>$ &mdash;</dd></div>
                </dl>
                <p className="report-note">Your real numbers appear here from week one.</p>
              </div>
            </div>
          </section>

          {/* LOCAL */}
          <section className="local" id="local" aria-labelledby="local-title">
            <div className="wrap local-grid">
              <h2 id="local-title" className="local-title" data-reveal>We live where your customers live.</h2>
              <div className="local-body" data-reveal>
                <p>
                  Ossmark Media is a South Jersey agency, not a national shop that treats Haddonfield and Hammonton like the same zip code.
                  We plan around shore season, school calendars and how people here actually look for a contractor, a dentist or a place to eat.
                </p>
                <p className="local-industries-label">Businesses we’re built for</p>
                <ul className="chips">
                  <li>Home services &amp; contractors</li>
                  <li>Med spas &amp; salons</li>
                  <li>Dental &amp; health practices</li>
                  <li>Restaurants &amp; bars</li>
                  <li>Real estate</li>
                  <li>Shore rentals &amp; seasonal businesses</li>
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
                  {/* REPLACE: set your recommended minimum ad budget */}
                  <p>Most local businesses start between <span data-replace="Recommended starting budget">$1,000 and $3,000 a month</span> in ad spend. We’ll recommend a number based on your service area, your average job value and how many new customers you can handle.</p>
                </details>
                <details>
                  <summary>What do you charge?<span className="faq-icon" aria-hidden="true"></span></summary>
                  {/* REPLACE: add your pricing model (flat monthly fee, % of spend, setup fee) */}
                  <p data-replace="Pricing">Our management fee is a flat monthly rate based on how many platforms we run for you. You’ll get an exact number before you commit to anything.</p>
                </details>
                <details>
                  <summary>How fast will I see results?<span className="faq-icon" aria-hidden="true"></span></summary>
                  <p>Leads usually start coming in during the first few weeks. The first month is about learning which ads, towns and offers work; months two and three are where cost per customer drops as we move budget to the winners.</p>
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
                <p>Pick a time that works for you. Fifteen minutes on Zoom, no pitch deck, no pressure.</p>
              </div>

              <div className="book-grid">
                <div className="book-calendar">
                  <div className="calendar-frame" data-cal data-cal-link="ossmark-media-qzze1b/15min">
                    {/* Cal.com inline embed mounts here (see site-behaviors.ts, same settings as Cal's embed snippet) */}
                    <div className="calendar-mount" id="my-cal-inline-15min" data-cal-mount></div>
                    <div className="calendar-fallback">
                      <p className="calendar-fallback-title">Pick a time for your call</p>
                      <p>The calendar opens in a new tab if it doesn’t load here.</p>
                      <a className="btn btn-dark" href="https://cal.com/ossmark-media-qzze1b/15min" target="_blank" rel="noopener">Open the booking calendar</a>
                    </div>
                  </div>
                  <p className="book-direct">Calendar not loading? <a href="https://cal.com/ossmark-media-qzze1b/15min" target="_blank" rel="noopener">Open the booking page</a></p>
                  <p className="book-confirm" role="status" aria-live="polite" data-booked></p>
                </div>

                <div className="book-message">
                  <h3 className="book-message-title">
                    <button type="button" className="book-message-toggle" aria-expanded="false" aria-controls="book-message-panel" data-message-toggle>
                      Rather send a message?
                      <span className="faq-icon" aria-hidden="true"></span>
                    </button>
                    <span className="book-message-heading">Rather send a message?</span>
                  </h3>
                  <div id="book-message-panel" className="book-message-panel" data-message-panel>
                  <div className="book-message-inner">
                  <p className="book-message-sub">Tell us about your business and we’ll reply within one business day.</p>
                  {/*
                    REPLACE: set data-endpoint to your form handler (Formspree, Netlify Forms, Basin, CRM webhook).
                    While it is empty, submitting opens the visitor's email app with the message filled in, so no lead is lost.
                  */}
                  <form className="contact-form" noValidate data-form data-endpoint="" data-mailto="donoven@ossmark.media">
                    <div className="form-error-summary" tabIndex={-1} hidden data-error-summary>
                      <p>Please fix the following:</p>
                      <ul></ul>
                    </div>
                    <div className="field">
                      <label htmlFor="f-name">Your name <span className="req" aria-hidden="true">*</span></label>
                      <input id="f-name" name="name" type="text" autoComplete="name" required aria-describedby="f-name-err" />
                      <p className="field-error" id="f-name-err" aria-live="polite"></p>
                    </div>
                    <div className="field">
                      <label htmlFor="f-business">Business name <span className="req" aria-hidden="true">*</span></label>
                      <input id="f-business" name="business" type="text" autoComplete="organization" required aria-describedby="f-business-err" />
                      <p className="field-error" id="f-business-err" aria-live="polite"></p>
                    </div>
                    <div className="field">
                      <label htmlFor="f-email">Email <span className="req" aria-hidden="true">*</span></label>
                      <input id="f-email" name="email" type="email" autoComplete="email" required aria-describedby="f-email-err" />
                      <p className="field-error" id="f-email-err" aria-live="polite"></p>
                    </div>
                    <div className="field">
                      <label htmlFor="f-budget">Monthly ad budget</label>
                      <select id="f-budget" name="budget">
                        <option value="">Not sure yet</option>
                        <option>Under $1,000</option>
                        <option>$1,000–$3,000</option>
                        <option>$3,000–$7,500</option>
                        <option>$7,500+</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="f-message">What would you like more of?</label>
                      <textarea id="f-message" name="message" rows={3} placeholder="More calls for kitchen remodels in Cherry Hill"></textarea>
                    </div>
                    <button className="btn btn-dark btn-block" type="submit" data-submit>
                      <span className="btn-label">Send message</span>
                    </button>
                    <p className="form-status" role="status" aria-live="polite" data-status></p>
                  </form>
                  </div>
                  </div>
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
