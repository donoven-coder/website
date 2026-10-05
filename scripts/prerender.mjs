// Writes the server-rendered page into dist/index.html, after `vite build` (client)
// and `vite build --ssr src/entry-server.tsx` (server bundle in dist-ssr/).
import { readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const htmlPath = path.join(root, "dist/index.html");
const ssrDir = path.join(root, "dist-ssr");

const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
const html = await readFile(htmlPath, "utf8");
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`);

const appHtml = render();
await writeFile(htmlPath, html.replace(marker, `<div id="root">${appHtml}</div>`));
await rm(ssrDir, { recursive: true, force: true });
console.log(`prerender: wrote ${appHtml.length.toLocaleString()} characters of HTML into dist/index.html`);
