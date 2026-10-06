// Writes the server-rendered page into dist/index.html, after `vite build` (client)
// and `vite build --ssr src/entry-server.tsx` (server bundle in dist-ssr/).
import { readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ssrDir = path.join(root, "dist-ssr");
const marker = '<div id="root"></div>';

const { render, renderBooked } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
for (const [file, renderPage] of [["index.html", render], ["booked.html", renderBooked]]) {
  const htmlPath = path.join(root, "dist", file);
  const html = await readFile(htmlPath, "utf8");
  if (!html.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/${file}`);
  const appHtml = renderPage();
  await writeFile(htmlPath, html.replace(marker, `<div id="root">${appHtml}</div>`));
  console.log(`prerender: wrote ${appHtml.length.toLocaleString()} characters of HTML into dist/${file}`);
}
await rm(ssrDir, { recursive: true, force: true });
