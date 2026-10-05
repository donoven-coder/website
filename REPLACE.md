# Ossmark Media site — content to replace before launch

Open the site with `?replace` on the end of the URL (for example `index.html?replace`)
to see every placeholder outlined in orange. Each one is also marked in the code with
a `<!-- REPLACE: ... -->` comment and/or a `data-replace` attribute.

## Already real
- Logo: traced from your logo file into `src/assets/brand/` (lockup, O mark, wordmark). The original is `public/brand/logo-source.png`.
- Booking: the embedded calendar is your Cal.com discovery call (15 min): https://cal.com/ossmark-media-qzze1b/15min. To change it, edit `data-cal-link` on the calendar frame in `src/App.tsx`.
- Email: donoven@ossmark.media
- Meta Pixel `1606518160921650`: PageView on every page (`index.html`), Lead when the booking questions are submitted, Schedule only when a Cal.com booking is completed (`src/lib/tracking.ts`).
- Booking questions: trade, monthly ad spend and goal unlock the calendar and are passed to Cal.com as the booking's notes plus `metadata[trade]`, `metadata[ad_budget]`, `metadata[goal]` and `metadata[fit]`. Bookings from "Other home service" or "Under $1,000" are tagged `fit=review` and their notes start with "[Review fit]". Nobody is blocked.

## Highest impact for conversions
- [ ] **Founder video** (hero panel): record a 60–90 second video covering who you are, who you help and what the call covers, then embed it in `.hero-media`. Until then, the panel shows the animated map.
- [ ] **Founder photo**: save a portrait (4:5, at least 1000px wide) as `src/assets/founder.jpg`, import it in `src/App.tsx` (`import founderPhoto from "@/assets/founder.jpg"`) and add `<img src={founderPhoto} alt="Donoven, founder of Ossmark Media">` inside `.founder-photo`. Importing it gives the file a hashed name, so it's safe under the one-year cache.
- [ ] **Founder story**: rewrite the two paragraphs in your own words.
- [ ] **Conversions API** (recommended before scaling spend): add a Vercel function at `api/meta-capi.ts` with a `META_CAPI_TOKEN` environment variable, then set `CAPI_ENDPOINT` in `src/lib/tracking.ts`. Browser events already carry an `eventID`, so Meta de-duplicates the pair.
- [ ] **Google Ads conversion** (optional): add it next to `trackSchedule` in `src/lib/tracking.ts`.

## Business details to confirm
- [ ] **Launch timeline**: "within 7 days of kickoff".
- [ ] **Guarantee**: "20 booked jobs in 60 days, or month three is free" (hero, report section, FAQ). Make sure your client agreement matches it.
- [ ] **Client promises**: month-to-month, client-owned accounts, weekly reporting, reply within one business day.
- [ ] **Map home base**: `HUB` in `src/lib/site-behaviors.ts` is set to Cherry Hill.
- [ ] **Phone number**: add one to the footer if you want it listed.

## Add later (slots are ready)
- [ ] **Client results / case studies**: add a real case study next to the guarantee once you have one. Don't publish numbers until they're real.
- [ ] **Testimonials**: add them after the report section.
- [ ] **Social share image**: add `og:image` (1200×630) and `og:url` in the `<head>` once the domain is live.

## Project structure
- React + TypeScript + Tailwind CSS v4, built with Vite. shadcn-ready (`components.json`, `@/` import alias, `src/lib/utils.ts`).
- `src/components/ui/`: shared UI components (shadcn convention). `velaris.tsx` is the hero background (CSS-only gradient drift; styles under "Hero background" in `site.css`); `spotlight-card.tsx` is the GlowCard used in Services.
- `src/components/sections/`: page sections (`hero.tsx`, `services.tsx`). Hero gradient colors are `HERO_COLORS` in `hero.tsx`.
- `src/App.tsx`: the rest of the page. `src/lib/site-behaviors.ts`: map, menu, reveals, booking bar, booking questions + Cal.com embed and copy-email buttons. `src/lib/tracking.ts`: Meta Pixel events.
- `src/styles/site.css`: the site's design system, inlined into the page at build time (`vite.config.ts`). `src/assets/`: fonts and logo (hashed at build time, cached for a year). `public/`: favicon, font licenses and the logo source file.
- Performance: keep anything in `/assets` hash-named (import it from `src/`), because `vercel.json` caches that folder for a year. The Cal.com script loads only once someone starts the booking questions.
- Add more shadcn components with `npx shadcn@latest add <name>`.

## Publishing (Vercel)
This repository is the website itself, so Vercel's default settings work.

1. In Vercel: Add New, then Project, then import this repository (`website`).
2. Leave every setting as detected (Framework: Vite, Build: `npm run build`, Output: `dist`). Click Deploy.
3. Add your domain (for example ossmark.media) under Project, then Settings, then Domains, and follow the DNS instructions.

Every push to `main` redeploys automatically.

Local preview: `npm install`, then `npm run dev`.
