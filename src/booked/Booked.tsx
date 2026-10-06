import { CONFIRMATION_VIDEO_URL } from "./config";

// Static markup for /booked, rendered to HTML at build time (scripts/prerender.mjs).
// No React runs in the browser here: src/booked/main.ts fills in the booking time and the
// reschedule link from sessionStorage and handles the video click, so this page stays tiny
// and the homepage bundle isn't split to share React with it.

export const loomId = (url: string) => url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]{16,})/i)?.[1] ?? "";

export function Booked() {
  const videoId = loomId(CONFIRMATION_VIDEO_URL);
  return (
    <>
      <header className="bk-top">
        <a className="bk-brand" href="/" aria-label="Ossmark Media home">
          <span className="bk-mark" aria-hidden="true"></span>
          <span className="bk-word" aria-hidden="true"></span>
        </a>
      </header>

      <main className="bk">
        <h1 className="bk-title">You’re booked.</h1>
        <p className="bk-sub">Here’s what happens next.</p>

        <section className="bk-card" aria-labelledby="bk-call">
          <h2 id="bk-call" className="bk-label">Your call</h2>
          <ul className="bk-call">
            <li className="bk-when" data-booking-time>Check your confirmation email for the time.</li>
            <li>15 minutes on Zoom</li>
            <li>Your Zoom link is in your confirmation email.</li>
          </ul>
        </section>

        <section className="bk-prep" aria-labelledby="bk-before">
          <h2 id="bk-before" className="bk-h2">Before the call</h2>
          <ul>
            <li>Have your average job value handy. A rough number is fine.</li>
            <li>Know roughly what you spend on ads today, even if it’s zero.</li>
            <li>Think about your best month and what held it back: leads, crew or schedule.</li>
          </ul>
        </section>

        {videoId ? (
          <section className="bk-video" aria-labelledby="bk-video-title">
            <h2 id="bk-video-title" className="bk-h2">A quick hello from Donoven</h2>
            {/* Poster only; main.ts swaps in the Loom iframe on click. No iframe before that. */}
            <div className="bk-video-frame">
              <button type="button" className="bk-video-poster" data-video-id={videoId} aria-label="Play: A quick hello from Donoven">
                <img src={`https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`} alt="" loading="lazy" decoding="async" />
              </button>
            </div>
          </section>
        ) : null}

        <p className="bk-small" data-reschedule hidden>
          Need to change the time? <a href="https://cal.com/bookings/upcoming" rel="noopener" data-reschedule-link>Reschedule or cancel</a>
        </p>
      </main>
    </>
  );
}
