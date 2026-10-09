// Footer behaviors for pages other than the homepage (/privacy, /terms, /booked): the year and
// the copy-email button. Same behavior as the homepage footer (see site-behaviors.ts).
export function initFooter(): void {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    const label = btn.querySelector<HTMLElement>("[data-copy-label]");
    const original = label?.textContent ?? "";
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy!;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
      }
      if (label) {
        label.textContent = ok ? "Copied" : "Press Ctrl+C to copy";
        btn.classList.toggle("is-copied", ok);
        window.setTimeout(() => { label.textContent = original; btn.classList.remove("is-copied"); }, 1800);
      }
    });
  });
}
