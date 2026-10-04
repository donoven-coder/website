# Ossmark Media site — content to replace before launch

Open the site with `?replace` on the end of the URL (for example `index.html?replace`)
to see every placeholder outlined in orange. Each one is also marked in the code with
a `<!-- REPLACE: ... -->` comment and/or a `data-replace` attribute.

## Already real
- Logo: traced from your logo file into `assets/brand/` (lockup, O mark, wordmark). The original is `assets/brand/logo-source.png`.
- Booking: the embedded calendar is your Cal.com discovery call (15 min): https://cal.com/ossmark-media-qzze1b/15min. To change it, edit `data-cal-link` on the calendar frame in `src/App.tsx`.
- Email: donoven@ossmark.media

## Highest impact for conversions
- [ ] **Founder video** (hero panel): record a 60–90 second video covering who you are, who you help and what the call covers, then embed it in `.hero-media`. Until then, the panel shows the animated map.
- [ ] **Founder photo**: save a portrait (4:5, at least 1000px wide) as `assets/founder.jpg` and add `<img src="assets/founder.jpg" alt="Donoven, founder of Ossmark Media">` inside `.founder-photo`.
- [ ] **Founder story**: rewrite the two paragraphs in your own words.
- [ ] **Founding client offer** (optional): "first 5 clients, setup fee waived, rate locked for 12 months". Edit the terms or delete the block.
- [ ] **Ad pixel conversion**: fire `fbq('track', 'Schedule')` (and/or a Google Ads conversion) where the comment marks a completed Cal.com booking (`src/lib/site-behaviors.ts`).

## Business details to confirm
- [ ] **Launch timeline**: "within 7 days of kickoff".
- [ ] **Recommended starting budget**: "$1,000 to $3,000 a month" (FAQ).
- [ ] **Pricing answer** (FAQ): flat monthly rate. Update it to your real model.
- [ ] **Client promises**: month-to-month, client-owned accounts, weekly reporting, reply within one business day.
- [ ] **Map home base**: `HUB` in `main.js` is set to Cherry Hill.
- [ ] **Phone number**: add one to the footer if you want it listed.

## Message form
- [ ] Set `data-endpoint` on the `<form>` to a Formspree, Netlify Forms, Basin or CRM webhook URL. Until then, submitting opens the visitor's email app addressed to donoven@ossmark.media, so no lead is lost.

## Add later (slots are ready)
- [ ] **Client results / case studies**: swap the founding-client offer for a real case study once you have one. Don't publish numbers until they're real.
- [ ] **Testimonials**: add them after the report section.
- [ ] **Social share image**: add `og:image` (1200×630) and `og:url` in the `<head>` once the domain is live.

## Project structure
- React + TypeScript + Tailwind CSS v4, built with Vite. shadcn-ready (`components.json`, `@/` import alias, `src/lib/utils.ts`).
- `src/components/ui/`: shared UI components (shadcn convention). `velaris.tsx` is the animated WebGL hero background; `spotlight-card.tsx` is the GlowCard used in Services.
- `src/components/sections/`: page sections (`hero.tsx`, `services.tsx`). Hero gradient colors are `HERO_COLORS` in `hero.tsx`.
- `src/App.tsx`: the rest of the page. `src/lib/site-behaviors.ts`: map, menu, reveals, booking bar, Cal.com embed, copy-email button and form.
- `src/styles/site.css`: the site's design system. `public/assets/`: fonts, logo and favicon.
- Add more shadcn components with `npx shadcn@latest add <name>`.

## Publishing (Vercel)
This repository is the website itself, so Vercel's default settings work.

1. In Vercel: Add New, then Project, then import this repository (`website`).
2. Leave every setting as detected (Framework: Vite, Build: `npm run build`, Output: `dist`). Click Deploy.
3. Add your domain (for example ossmark.media) under Project, then Settings, then Domains, and follow the DNS instructions.

Every push to `main` redeploys automatically.

Local preview: `npm install`, then `npm run dev`.
