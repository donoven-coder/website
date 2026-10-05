import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Fonts the first screen needs; preloaded so text doesn't wait on the stylesheet to discover them.
const PRELOAD_FONTS = ["instrument-serif", "instrument-serif-italic", "dmsans"];

// Build only: inline the stylesheet into index.html (removes a render-blocking request) and
// preload the hero fonts by their hashed file names.
function inlineCssAndPreloadFonts(): Plugin {
  return {
    name: "ossmark-inline-css-preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        for (const [file, out] of Object.entries(bundle)) {
          if (out.type !== "asset" || !file.endsWith(".css")) continue;
          const link = new RegExp(`<link[^>]*href="/${file.replace(/[.]/g, "\\.")}"[^>]*>`);
          if (!link.test(html)) continue;
          html = html.replace(link, () => `<style>${String(out.source)}</style>`);
          delete bundle[file];
        }
        const preloads = PRELOAD_FONTS.map((name) => {
          const file = Object.keys(bundle).find((f) => new RegExp(`^assets/${name}-[\\w-]{8}\\.woff2$`).test(f));
          if (!file) throw new Error(`Font to preload not found in bundle: ${name}`);
          return `<link rel="preload" href="/${file}" as="font" type="font/woff2" crossorigin>`;
        });
        return html.replace(
          "<!-- Font preloads (hashed file names) are added at build time; see vite.config.ts -->",
          preloads.join("\n  "),
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineCssAndPreloadFonts()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
