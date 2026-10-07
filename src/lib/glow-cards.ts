// Pointer-following glow for the GlowCards in Services (markup: components/ui/spotlight-card.tsx).
// One shared pointer listener for every card instead of one per card, attached only while a
// card is on screen. Card positions are measured in a ResizeObserver callback (after layout,
// so no forced reflow), and each frame only the cards near the pointer are restyled: the
// spotlight is 200px, so a card further away than that shows no glow anyway.

type GlowEntry = { el: HTMLDivElement; box: { top: number; left: number; width: number; height: number } | null; lit: boolean; visible: boolean };
const glowCards = new Set<GlowEntry>();
const GLOW_RANGE = 260;
let glowX = -1e4, glowY = -1e4, glowFrame = 0, glowListening = false;

const measureGlowCards = () => {
  glowCards.forEach((c) => {
    const r = c.el.getBoundingClientRect();
    c.box = { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
  });
};

const applyGlow = () => {
  glowFrame = 0;
  const sx = window.scrollX, sy = window.scrollY;
  glowCards.forEach((c) => {
    if (!c.box || !c.visible) return;
    const left = c.box.left - sx, top = c.box.top - sy;
    const dx = Math.max(left - glowX, 0, glowX - (left + c.box.width));
    const dy = Math.max(top - glowY, 0, glowY - (top + c.box.height));
    const near = Math.hypot(dx, dy) < GLOW_RANGE;
    // Update cards in range, plus one last time for a card the pointer just left.
    if (!near && !c.lit) return;
    c.lit = near;
    c.el.style.setProperty("--x", glowX.toFixed(2));
    c.el.style.setProperty("--xp", (glowX / window.innerWidth).toFixed(2));
    c.el.style.setProperty("--y", glowY.toFixed(2));
    c.el.style.setProperty("--yp", (glowY / window.innerHeight).toFixed(2));
  });
};

const onGlowPointer = (e: PointerEvent) => {
  glowX = e.clientX;
  glowY = e.clientY;
  if (!glowFrame) glowFrame = requestAnimationFrame(applyGlow);
};

const syncGlowListener = () => {
  const any = [...glowCards].some((c) => c.visible);
  if (any && !glowListening) document.addEventListener("pointermove", onGlowPointer, { passive: true });
  if (!any && glowListening) document.removeEventListener("pointermove", onGlowPointer);
  glowListening = any;
};

/** Starts the glow on every prerendered card (`[data-glow-card]`). Cards live for the whole page. */
export function initGlowCards(): void {
  const cards = document.querySelectorAll<HTMLDivElement>("[data-glow-card]");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  const ro = new ResizeObserver(measureGlowCards);
  ro.observe(document.body);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => glowCards.forEach((c) => { if (c.el === e.target) c.visible = e.isIntersecting; }));
    syncGlowListener();
  });
  cards.forEach((el) => {
    glowCards.add({ el, box: null, lit: false, visible: false });
    ro.observe(el);
    io.observe(el);
  });
}
