// Build-time prerender entry (see scripts/prerender.mjs). Renders the same tree as
// main.tsx to static HTML, so the page paints before any JavaScript has run.
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
