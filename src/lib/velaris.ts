// Hero background (markup: components/ui/velaris.tsx, styles: site.css "Hero background").
// The vignette and glow are sized from the hero's height, as in the original shader, and the
// color fields drift only while the hero is on screen and the tab is visible.
export function initVelaris(): void {
  document.querySelectorAll<HTMLElement>("[data-velaris]").forEach((container) => {
    // ResizeObserver reports the size after layout, so this never forces a reflow.
    new ResizeObserver(([entry]) => {
      container.style.setProperty("--vl-h", `${Math.round(entry.contentRect.height)}px`);
    }).observe(container);

    if (!("IntersectionObserver" in window)) return;
    let onScreen = true;
    const sync = () => container.classList.toggle("is-paused", !onScreen || document.hidden);
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    }).observe(container);
    document.addEventListener("visibilitychange", sync);
  });
}
