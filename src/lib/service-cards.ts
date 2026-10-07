// Services: on phones each card's "What's included" list folds behind a toggle (markup:
// components/sections/services.tsx; the toggle is hidden above 760px, where lists always show).
export function initServiceCards(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-service-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.closest<HTMLElement>(".service-card-body")?.setAttribute("data-expanded", String(open));
    });
  });
}
