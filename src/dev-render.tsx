// Dev server only (see main.ts): renders the homepage into the empty root, synchronously, so
// the page behaviors can attach to it right after. Production uses the prerendered HTML.
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import App from "./App";

export function renderPage(root: HTMLElement) {
  flushSync(() => createRoot(root).render(<StrictMode><App /></StrictMode>));
}
