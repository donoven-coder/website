// Homepage in the browser: plain TypeScript on top of the prerendered page (scripts/prerender.mjs),
// so no React ships to visitors. Each behavior starts on its own, so one failing can't stop the
// others; the content stays readable either way and the failsafe in index.html reveals it.
import "./index.css";
import { initSite } from "@/lib/site-behaviors";
import { initVelaris } from "@/lib/velaris";
import { initGlowCards } from "@/lib/glow-cards";
import { initServiceCards } from "@/lib/service-cards";

function start() {
  for (const [name, init] of [
    ["Hero background", initVelaris],
    ["Service cards", initServiceCards],
    ["Card glow", initGlowCards],
    ["Page behaviors", initSite],
  ] as const) {
    try {
      init();
    } catch (err) {
      console.error(`${name} failed to start`, err);
    }
  }
}

// The dev server serves an empty root, so render the page with React first. This branch is
// removed from production builds, where the markup is already in the HTML.
const root = document.getElementById("root")!;
if (import.meta.env.DEV && !root.hasChildNodes()) {
  import("./dev-render").then(({ renderPage }) => { renderPage(root); start(); });
} else {
  start();
}
