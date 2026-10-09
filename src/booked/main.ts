// /booked in the browser: a few lines of plain TypeScript on top of the prerendered page.
import "../styles/booked.css";
import { formatET } from "@/lib/time";
import { initFooter } from "@/lib/footer";

type Booking = { uid?: string; startTime?: string };

let booking: Booking = {};
try { booking = JSON.parse(sessionStorage.getItem("ossmark:booking") || "{}") as Booking; } catch { /* keep the fallback text */ }

// Booking time in Eastern time; the prerendered fallback stays if it's missing.
const when = formatET(booking.startTime);
const timeEl = document.querySelector<HTMLElement>("[data-booking-time]");
if (when && timeEl) timeEl.textContent = when;

// Reschedule / cancel link for this booking (Cal's booking page for the uid).
const uid = typeof booking.uid === "string" && /^[\w-]{4,80}$/.test(booking.uid) ? booking.uid : "";
const reschedule = document.querySelector<HTMLElement>("[data-reschedule]");
const link = document.querySelector<HTMLAnchorElement>("[data-reschedule-link]");
if (uid && reschedule && link) {
  link.href = `https://cal.com/booking/${uid}`;
  reschedule.hidden = false;
}

// Video: the Loom iframe is created only after the visitor clicks the poster.
document.querySelector<HTMLButtonElement>("[data-video-id]")?.addEventListener("click", (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.loom.com/embed/${btn.dataset.videoId}?autoplay=1&hide_owner=true&hide_share=true`;
  iframe.title = "A quick hello from Donoven";
  iframe.allow = "autoplay; fullscreen";
  iframe.allowFullscreen = true;
  btn.replaceWith(iframe);
}, { once: true });

initFooter();
