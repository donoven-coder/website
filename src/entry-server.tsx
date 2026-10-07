// Build-time prerender entry (see scripts/prerender.mjs). Renders the pages to static HTML,
// so they paint before any JavaScript has run. React only runs here, never in the browser.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { Booked } from "./booked/Booked";

export function renderBooked(): string {
  return renderToString(
    <StrictMode>
      <Booked />
    </StrictMode>,
  );
}

export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
