// Renders og.html to public/og-image.jpg (1200x630), the image shown when ossmark.media is shared.
// Needs Playwright with a Chromium build, which isn't a project dependency:
//   npx -p playwright node brand-kit/share-image/render.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${here("./og.html")}`);
// Load every face explicitly: fonts.ready can resolve before a face has been requested.
await page.evaluate(() => Promise.all([
  document.fonts.load('400 112px "Instrument Serif"'),
  document.fonts.load('italic 400 112px "Instrument Serif"'),
  document.fonts.load('400 26px "DM Sans"'),
  document.fonts.load('500 26px "DM Sans"'),
]));
await page.screenshot({ path: here("../../public/og-image.jpg"), type: "jpeg", quality: 88 });
await browser.close();
console.log("wrote public/og-image.jpg");
