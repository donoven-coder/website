// Page behaviors: hero map, mobile menu, scroll reveals, process progress,
// sticky booking bar, booking qualifier + lazy Cal.com embed and copy-email buttons.
// Runs once after React has rendered the page (see App.tsx).

import { trackLead, trackSchedule, type QualifierAnswers } from "@/lib/tracking";

let initialized = false;

// Set by the hosted preview build (see scripts/build-preview.py): the preview host blocks
// third-party frames, so the Cal.com calendar links out instead of embedding.
const isPreview = () => Boolean((window as unknown as { OSSMARK_PREVIEW?: boolean }).OSSMARK_PREVIEW);

export function initSite(): () => void {
  if (initialized) return () => {};
  initialized = true;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------------
     Layout cache: element positions are measured inside a ResizeObserver
     callback (which runs right after layout, so reading never forces a
     reflow) and reused by every scroll and pointer handler. Re-measured
     whenever the page changes size (fonts, FAQ answers opening, rotation).
     ------------------------------------------------------------------ */
  type Box = { top: number; left: number; width: number; height: number };
  const measurers: (() => void)[] = [];
  const onMeasured: (() => void)[] = [];
  const pageBox = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
  };
  const remeasure = () => { measurers.forEach((m) => m()); onMeasured.forEach((f) => f()); };
  new ResizeObserver(remeasure).observe(document.body);

  /* ------------------------------------------------------------------
     Placeholder review mode: add ?replace to the URL.
     ------------------------------------------------------------------ */
  if (new URLSearchParams(location.search).has("replace")) {
    document.documentElement.classList.add("show-replace");
    const count = document.querySelectorAll("[data-replace]").length;
    const banner = document.createElement("div");
    banner.className = "show-replace-banner";
    banner.setAttribute("role", "status");
    banner.textContent = `${count} placeholders outlined. See site/REPLACE.md for the full list.`;
    document.body.appendChild(banner);
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------
     Header: solid background once the page scrolls
     ------------------------------------------------------------------ */
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (header) {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
    sentinel.setAttribute("aria-hidden", "true");
    document.body.prepend(sentinel);
    new IntersectionObserver(([entry]) => {
      header.classList.toggle("is-scrolled", !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  if (toggle && nav) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      header?.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ------------------------------------------------------------------
     Hero map — South Jersey towns plotted from real coordinates
     ------------------------------------------------------------------ */
  const map = document.querySelector<SVGSVGElement>("[data-map]");
  if (map) buildMap(map);

  function buildMap(svg: SVGSVGElement) {
    // REPLACE: set HUB to the town Ossmark is based in.
    const HUB = "Cherry Hill";
    const towns: [string, number, number, boolean][] = [
      // [name, lat, lon, showLabel]
      ["Burlington", 40.071, -74.865, false],
      ["Moorestown", 39.969, -74.949, true],
      ["Cherry Hill", 39.934, -75.031, true],
      ["Collingswood", 39.918, -75.071, false],
      ["Mount Laurel", 39.934, -74.891, false],
      ["Haddonfield", 39.891, -75.038, false],
      ["Marlton", 39.891, -74.922, false],
      ["Medford", 39.900, -74.823, false],
      ["Voorhees", 39.852, -74.952, false],
      ["Washington Twp", 39.750, -75.070, false],
      ["Mullica Hill", 39.739, -75.224, false],
      ["Glassboro", 39.702, -75.112, true],
      ["Pennsville", 39.653, -75.516, false],
      ["Hammonton", 39.637, -74.802, true],
      ["Vineland", 39.486, -75.026, true],
      ["Millville", 39.402, -75.039, false],
      ["Egg Harbor Twp", 39.380, -74.600, false],
      ["Atlantic City", 39.364, -74.423, true],
      ["Ocean City", 39.278, -74.575, true],
      ["Sea Isle City", 39.153, -74.693, false],
      ["Wildwood", 38.992, -74.815, false],
      ["Cape May", 38.935, -74.906, true],
    ];

    // Equirectangular projection scaled by cos(latitude) so distances read true.
    const W = 400, H = 520, PAD = 34;
    const lats = towns.map((t) => t[1]), lons = towns.map((t) => t[2]);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const kx = Math.cos(((latMin + latMax) / 2) * Math.PI / 180);
    const spanX = (lonMax - lonMin) * kx, spanY = latMax - latMin;
    const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    const offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2;
    const project = (lat: number, lon: number): [number, number] => [
      offX + (lon - lonMin) * kx * scale,
      offY + (latMax - lat) * scale,
    ];

    const el = (name: string, attrs: Record<string, string | number>, parent?: Element) => {
      const node = document.createElementNS(SVG_NS, name);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
      if (parent) parent.appendChild(node);
      return node;
    };

    const routes = el("g", { "aria-hidden": "true" }, svg);
    const pulses = el("g", { "aria-hidden": "true" }, svg);
    const dots = el("g", { "aria-hidden": "true" }, svg);
    const labels = el("g", { "aria-hidden": "true" }, svg);

    // Orientation labels (approximate placement)
    const [rx, ry] = project(39.40, -75.38);
    el("text", { x: rx, y: ry, class: "region-label", "text-anchor": "middle" }, labels).textContent = "Delaware Bay";
    const [ox, oy] = project(39.08, -74.43);
    el("text", { x: ox, y: oy, class: "region-label", "text-anchor": "middle" }, labels).textContent = "Atlantic Ocean";

    const hub = towns.find((t) => t[0] === HUB) || towns[0];
    const [hx, hy] = project(hub[1], hub[2]);

    // Order towns by distance from the hub so the animation radiates outward.
    const ordered = towns
      .map((t) => {
        const [x, y] = project(t[1], t[2]);
        return { name: t[0], x, y, label: t[3], d: Math.hypot(x - hx, y - hy) };
      })
      .sort((a, b) => a.d - b.d);

    ordered.forEach((t, i) => {
      const isHub = t.name === hub[0];
      if (!isHub) {
        // Gentle arc from the hub to each town
        const mx = (hx + t.x) / 2, my = (hy + t.y) / 2;
        const nx = -(t.y - hy), ny = t.x - hx;
        const len = Math.hypot(nx, ny) || 1;
        const bend = Math.min(40, t.d * 0.18);
        const cx = mx + (nx / len) * bend, cy = my + (ny / len) * bend;
        const path = el("path", {
          d: `M${hx.toFixed(1)} ${hy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}`,
          class: "route",
        }, routes);
        const L = Math.ceil(t.d * 1.15);
        path.style.setProperty("--len", String(L));
        path.style.setProperty("--i", String(i));

        // Pulse ring; each town fires at its own moment in the cycle.
        const ring = el("circle", { cx: t.x, cy: t.y, r: 5, class: "pulse" }, pulses);
        ring.style.setProperty("--p", String(Math.round((i * 997) % 3600)));
      }

      const dot = el("circle", {
        cx: t.x,
        cy: t.y,
        r: isHub ? 8 : 4.5,
        class: isHub ? "town-dot is-hub" : "town-dot",
      }, dots);
      dot.style.setProperty("--i", String(i));

      if (t.label || isHub) {
        // Labels sit to the right of the dot, except near the coast where they would clip.
        const right = !["Atlantic City", "Ocean City"].includes(t.name);
        // Atlantic City's label sits above its dot so it clears Egg Harbor Twp.
        const above = t.name === "Atlantic City";
        const text = el("text", {
          x: t.x + (right ? 11 : above ? 4 : -11),
          y: t.y + (above ? -11 : 4.5),
          class: "town-label",
          "text-anchor": right ? "start" : "end",
        }, labels);
        text.textContent = t.name;
        text.style.setProperty("--i", String(i));
      }
    });

    // The intro (routes draw, dots pop, labels fade) plays when the map is actually seen,
    // not on a timer from page load, which had it finished before anyone scrolled to it.
    // Never before ~1s, so it doesn't overlap the hero panel fading in.
    const goLive = () => svg.classList.add("is-live");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      goLive();
    } else {
      const notBefore = performance.now() + 1000;
      const introIO = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        introIO.disconnect();
        window.setTimeout(goLive, Math.max(0, notBefore - performance.now()));
      }, { threshold: 0.3 });
      introIO.observe(svg);
    }

    // Pause the ambient pulse loop when off screen or the tab is hidden.
    let visible = true;
    const sync = () => svg.classList.toggle("is-paused", !visible || document.hidden);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.05 }).observe(svg);
    }
    document.addEventListener("visibilitychange", sync);
  }

  /* ------------------------------------------------------------------
     Process steps: progress line fills as each step scrolls into view
     ------------------------------------------------------------------ */
  const steps = document.querySelector<HTMLElement>("[data-steps]");
  if (steps) {
    const items = [...steps.querySelectorAll<HTMLElement>(".step")];
    const nums = items.map((el) => el.querySelector<HTMLElement>(".step-num")!);
    const vertical = window.matchMedia("(max-width: 900px)");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-reached"));
      steps.style.setProperty("--progress", "1");
    } else {
      // The line follows the scroll position continuously; each number lights (and
      // pulses once) the moment the line reaches it.
      let active = false, q = false;
      let stepsTop = 0, firstTop = 0, lastTop = 0;
      measurers.push(() => {
        stepsTop = pageBox(steps).top;
        firstTop = pageBox(nums[0]).top;
        lastTop = pageBox(nums[nums.length - 1]).top;
      });
      onMeasured.push(() => queue());
      const paint = () => {
        q = false;
        const y = window.scrollY;
        let progress: number;
        if (vertical.matches) {
          const span = lastTop - firstTop || 1;
          progress = (window.innerHeight * 0.62 - (firstTop - y)) / span;
        } else {
          progress = (window.innerHeight * 0.85 - (stepsTop - y)) / (window.innerHeight * 0.45);
        }
        progress = Math.min(1, Math.max(0, progress));
        steps.style.setProperty("--progress", progress.toFixed(4));
        items.forEach((el, i) => {
          const at = items.length > 1 ? i / (items.length - 1) : 0;
          el.classList.toggle("is-reached", progress >= at - 0.001);
        });
      };
      const queue = () => { if (active && !q) { q = true; requestAnimationFrame(paint); } };
      new IntersectionObserver(([e]) => { active = e.isIntersecting; queue(); }, { rootMargin: "20% 0px" }).observe(steps);
      window.addEventListener("scroll", queue, { passive: true });
    }
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ------------------------------------------------------------------
     Headings: split into words so they can rise out of a mask
     ------------------------------------------------------------------ */
  const splitTargets = document.querySelectorAll<HTMLElement>(
    ".section-title, .local-title, .book-title, .closer-title",
  );
  splitTargets.forEach((heading) => {
    if (heading.closest(".hero")) return;
    let w = 0;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    textNodes.forEach((node) => {
      const parts = (node.textContent ?? "").split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement("span");
        outer.className = "split-word";
        const inner = document.createElement("span");
        inner.textContent = part;
        inner.style.setProperty("--w", String(w++));
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.replaceWith(frag);
    });
    heading.setAttribute("data-split", "");
    if (!heading.hasAttribute("data-reveal")) heading.setAttribute("data-reveal", "");
  });

  /* ------------------------------------------------------------------
     Stance: words light up one by one as the sentence scrolls through view
     ------------------------------------------------------------------ */
  const stance = document.querySelector<HTMLElement>(".stance-text");
  if (stance) {
    const words: HTMLElement[] = [];
    const walker = document.createTreeWalker(stance, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      (node.textContent ?? "").split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const span = document.createElement("span");
        span.className = "scrub-word";
        span.textContent = part;
        words.push(span);
        frag.appendChild(span);
      });
      node.replaceWith(frag);
    });

    if (!reduceMotion.matches && "IntersectionObserver" in window) {
      // Dimmest state still meets WCAG AA 4.5:1 on this section's background:
      // grey #8E8E8B needs 0.9 opacity, the sky-blue turn needs 0.62.
      const floors = words.map((w) => (w.closest(".stance-turn") ? 0.62 : 0.9));
      let active = false;
      let queued = false;
      let lastLit = -1;
      let box: Box | null = null;
      measurers.push(() => { box = pageBox(stance); });
      // Paint as soon as positions are known, so the words are already at their
      // scroll-correct brightness before the section comes into view.
      onMeasured.push(() => { lastLit = -1; paint(); });
      const paint = () => {
        queued = false;
        if (!box) return;
        const vh = window.innerHeight;
        const top = box.top - window.scrollY;
        // Starts when the text reaches 85% down the screen, finishes as its end passes 45%.
        const progress = Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.4 + box.height)));
        const lit = progress * words.length;
        if (Math.abs(lit - lastLit) < 0.02) return;
        lastLit = lit;
        words.forEach((w, i) => {
          const t = Math.min(1, Math.max(0, lit - i));
          w.style.opacity = (floors[i] + (1 - floors[i]) * t).toFixed(3);
        });
      };
      const queue = () => { if (active && !queued) { queued = true; requestAnimationFrame(paint); } };
      new IntersectionObserver(([e]) => { active = e.isIntersecting; queue(); }).observe(stance);
      window.addEventListener("scroll", queue, { passive: true });
    }
  }

  /* ------------------------------------------------------------------
     Trailing follow: eases a value toward its target each frame, so things
     drift after the cursor instead of snapping to it. Sleeps when settled.
     ------------------------------------------------------------------ */
  const follow = (ease: number, apply: (x: number, y: number) => void) => {
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, primed = false;
    const tick = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      apply(cx, cy);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    return (x: number, y: number) => {
      tx = x; ty = y;
      if (!primed) { cx = x; cy = y; primed = true; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
  };
  const canHover = finePointer.matches && !reduceMotion.matches;

  /* ------------------------------------------------------------------
     Hero: a faint light trails the cursor across the gradient
     ------------------------------------------------------------------ */
  const heroLight = document.querySelector<HTMLElement>("[data-hero-light]");
  const heroSection = heroLight?.closest<HTMLElement>(".hero");
  if (heroLight && heroSection && canHover) {
    const moveLight = follow(0.07, (x, y) => {
      heroLight.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    const lightParent = heroLight.parentElement ?? heroSection;
    let lp: Box | null = null;
    measurers.push(() => { lp = pageBox(lightParent); });
    heroSection.addEventListener("pointermove", (e) => {
      if (lp) moveLight(e.pageX - lp.left, e.pageY - lp.top);
    }, { passive: true });
    heroSection.addEventListener("pointerenter", () => heroLight.classList.add("is-lit"));
    heroSection.addEventListener("pointerleave", () => heroLight.classList.remove("is-lit"));
  }

  /* ------------------------------------------------------------------
     Founder: the photo frame leans toward the cursor; a sheen glides across
     (on touch screens it drifts slightly with scroll instead)
     ------------------------------------------------------------------ */
  const photo = document.querySelector<HTMLElement>(".founder-photo");
  if (photo && !reduceMotion.matches) {
    const sheen = document.createElement("span");
    sheen.className = "founder-sheen";
    sheen.setAttribute("aria-hidden", "true");
    photo.appendChild(sheen);
    if (canHover) {
      const tilt = follow(0.09, (x, y) => {
        photo.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
        photo.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
        photo.style.setProperty("--sx", `${(50 + x * 60).toFixed(1)}%`);
        photo.style.setProperty("--sy", `${(50 + y * 60).toFixed(1)}%`);
      });
      const zone = photo.closest<HTMLElement>(".founder") ?? photo;
      let pb: Box | null = null;
      measurers.push(() => { pb = pageBox(photo); });
      zone.addEventListener("pointermove", (e) => {
        if (!pb) return;
        const nx = Math.max(-1, Math.min(1, (e.pageX - (pb.left + pb.width / 2)) / pb.width));
        const ny = Math.max(-1, Math.min(1, (e.pageY - (pb.top + pb.height / 2)) / pb.height));
        tilt(nx, ny);
      }, { passive: true });
      zone.addEventListener("pointerenter", () => photo.classList.add("is-tilting"));
      zone.addEventListener("pointerleave", () => { photo.classList.remove("is-tilting"); tilt(0, 0); });
    } else {
      let q = false;
      let pb: Box | null = null;
      // The drift itself moves the photo (--ty), so measure it without that offset.
      measurers.push(() => { const b = pageBox(photo); pb = { ...b, top: b.top - (parseFloat(photo.style.getPropertyValue("--ty")) || 0) }; });
      onMeasured.push(() => drift());
      const drift = () => {
        q = false;
        if (!pb) return;
        const p = (pb.top - window.scrollY + pb.height / 2) / window.innerHeight - 0.5;
        photo.style.setProperty("--ty", `${(p * -18).toFixed(1)}px`);
      };
      // Only while the photo is on screen.
      let inView = false;
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "10% 0px" }).observe(photo);
      window.addEventListener("scroll", () => { if (inView && !q) { q = true; requestAnimationFrame(drift); } }, { passive: true });
    }
  }

  /* ------------------------------------------------------------------
     Report: one highlight glides between metric rows as you point at them
     ------------------------------------------------------------------ */
  const metrics = document.querySelector<HTMLElement>(".report-metrics");
  if (metrics) {
    // The highlight lives in the card, not the <dl>, so the definition list stays valid.
    const card = metrics.parentElement!;
    const glider = document.createElement("span");
    glider.className = "report-glider";
    glider.setAttribute("aria-hidden", "true");
    card.insertBefore(glider, metrics);
    const rows = [...metrics.querySelectorAll<HTMLElement>(":scope > div:not(.is-key)")];
    const moveTo = (row: HTMLElement) => {
      glider.style.left = `${metrics.offsetLeft - 12}px`;
      glider.style.width = `${metrics.offsetWidth + 24}px`;
      glider.style.transform = `translateY(${metrics.offsetTop + row.offsetTop}px)`;
      glider.style.height = `${row.offsetHeight}px`;
      card.classList.add("is-pointing");
      rows.forEach((r) => r.classList.toggle("is-active", r === row));
    };
    rows.forEach((row) => {
      row.addEventListener("pointerenter", () => moveTo(row));
      row.addEventListener("pointerdown", () => moveTo(row));
    });
    metrics.addEventListener("pointerleave", () => {
      card.classList.remove("is-pointing");
      rows.forEach((r) => r.classList.remove("is-active"));
    });
  }

  /* ------------------------------------------------------------------
     Local: business chips brighten as the cursor comes near
     (touch screens get a single soft wave when the section arrives)
     ------------------------------------------------------------------ */
  const chipList = document.querySelector<HTMLElement>(".local .chips");
  if (chipList && !reduceMotion.matches) {
    const chips = [...chipList.querySelectorAll<HTMLElement>("li")];
    const zone = chipList.closest<HTMLElement>(".local") ?? chipList;
    if (canHover) {
      let px = -9999, py = -9999, q = false;
      let boxes: Box[] = [];
      measurers.push(() => { boxes = chips.map(pageBox); });
      const paint = () => {
        q = false;
        chips.forEach((c, i) => {
          const r = boxes[i];
          if (!r) return;
          const dx = Math.max(r.left - px, 0, px - (r.left + r.width));
          const dy = Math.max(r.top - py, 0, py - (r.top + r.height));
          const near = Math.max(0, 1 - Math.hypot(dx, dy) / 180);
          c.style.setProperty("--near", near.toFixed(3));
        });
      };
      zone.addEventListener("pointermove", (e) => { px = e.pageX; py = e.pageY; if (!q) { q = true; requestAnimationFrame(paint); } }, { passive: true });
      zone.addEventListener("pointerleave", () => { px = py = -9999; paint(); });
    } else if ("IntersectionObserver" in window) {
      chips.forEach((c, i) => c.style.setProperty("--i", String(i)));
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { chipList.classList.add("is-wave"); io.disconnect(); } }, { rootMargin: "0px 0px -25% 0px" });
      io.observe(chipList);
    }
  }

  /* ------------------------------------------------------------------
     Booking: a thin light traces the calendar edge while it's on screen
     ------------------------------------------------------------------ */
  const calFrame = document.querySelector<HTMLElement>(".calendar-frame");
  if (calFrame && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => calFrame.classList.toggle("is-tracing", e.isIntersecting)).observe(calFrame);
  }

  /* ------------------------------------------------------------------
     Closer: the logo drifts after the cursor with the same lag as the hero
     ------------------------------------------------------------------ */
  const closerLogo = document.querySelector<HTMLElement>("[data-closer-logo]");
  const closerSection = closerLogo?.closest<HTMLElement>(".closer");
  if (closerLogo && closerSection && canHover) {
    const drift = follow(0.06, (x, y) => {
      closerLogo.style.transform = `translate3d(${(x * 14).toFixed(2)}px, ${(y * 10).toFixed(2)}px, 0)`;
    });
    let cb: Box | null = null;
    measurers.push(() => { cb = pageBox(closerSection); });
    closerSection.addEventListener("pointermove", (e) => {
      if (cb) drift((e.pageX - cb.left) / cb.width - 0.5, (e.pageY - cb.top) / cb.height - 0.5);
    }, { passive: true });
    closerSection.addEventListener("pointerleave", () => drift(0, 0));
  }

  /* Promise rules draw one after another */
  const promises = document.querySelector<HTMLElement>(".promise-list");
  if (promises) {
    promises.querySelectorAll("li").forEach((li, i) => li.style.setProperty("--i", String(i)));
    promises.setAttribute("data-reveal", "");
  }

  /* ------------------------------------------------------------------
     Buttons: label rolls on hover; large buttons lean toward the pointer
     ------------------------------------------------------------------ */
  document.querySelectorAll<HTMLElement>(".btn").forEach((btn) => {
    if (btn.children.length || !btn.textContent?.trim()) return;
    const label = btn.textContent.trim();
    const roll = document.createElement("span");
    roll.className = "btn-roll";
    const a = document.createElement("span");
    a.textContent = label;
    const b = document.createElement("span");
    b.textContent = label;
    b.setAttribute("aria-hidden", "true");
    roll.append(a, b);
    btn.textContent = "";
    btn.appendChild(roll);
  });

  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll<HTMLElement>(".btn-lg, .closer .btn, .hero-media .btn").forEach((btn) => {
      btn.classList.add("btn-magnetic");
      // Measured once as the pointer arrives (not on every move), in page coordinates.
      let r: Box | null = null;
      btn.addEventListener("pointerenter", () => { r = pageBox(btn); });
      btn.addEventListener("pointermove", (e) => {
        if (!r) return;
        const dx = (e.pageX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.pageY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform = `translate(${(dx * 6).toFixed(1)}px, ${(dy * 4).toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------
     Header: thin progress line showing how far down the page you are
     ------------------------------------------------------------------ */
  if (header) {
    let ticking = false;
    let pageHeight = 0;
    measurers.push(() => { pageHeight = document.documentElement.scrollHeight; });
    onMeasured.push(() => updateProgress());
    const updateProgress = () => {
      ticking = false;
      const max = pageHeight - window.innerHeight;
      header.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Scroll reveals (a few key blocks, once each) + closing logo reveal
     ------------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll("[data-reveal], [data-closer-logo]");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    revealTargets.forEach((el) => revealIO.observe(el));
  }
  // Reveals are wired up, so the no-script failsafe in index.html can stand down.
  (window as unknown as { __ossmarkReady?: boolean }).__ossmarkReady = true;

  /* ------------------------------------------------------------------
     Mobile sticky "Book" bar: shows after the hero, hides at the booking
     section so it never covers the calendar or the form.
     ------------------------------------------------------------------ */
  const sticky = document.querySelector<HTMLElement>("[data-sticky-cta]");
  const heroEl = document.querySelector<HTMLElement>(".hero-actions");
  const bookEl = document.querySelector<HTMLElement>("#book");
  if (sticky && heroEl && bookEl && "IntersectionObserver" in window) {
    let pastHero = false, atBook = false;
    const stickyLink = sticky.querySelector("a")!;
    const syncSticky = () => {
      const show = pastHero && !atBook;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", String(!show));
      stickyLink.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      syncSticky();
    }).observe(heroEl);
    new IntersectionObserver(([e]) => { atBook = e.isIntersecting; syncSticky(); }, { rootMargin: "0px 0px -20% 0px" }).observe(bookEl);
  }

  /* ------------------------------------------------------------------
     Booking: a short qualifier unlocks the Cal.com calendar (official embed.js).
     The script loads when the visitor starts the qualifier; the calendar itself
     mounts on submit, with the answers prefilled as booking notes + metadata.
     Booking link: data-cal-link on the calendar frame.
     ------------------------------------------------------------------ */
  const cal = document.querySelector<HTMLElement>("[data-cal]");
  const qualify = document.querySelector<HTMLFormElement>("[data-qualify]");
  if (cal && qualify) {
    const ns = "15min"; // matches the namespace in Cal.com's embed snippet
    const calLink = cal.dataset.calLink!;
    const booked = document.querySelector("[data-booked]");
    const direct = cal.querySelector<HTMLAnchorElement>("[data-cal-direct]");
    let answers: QualifierAnswers | null = null;
    let leadSent = false;
    let scheduleSent = false;
    let api: ((...args: unknown[]) => void) | null = null;

    type CalApi = ((...args: unknown[]) => void) & { q?: unknown[][]; ns?: Record<string, CalApi>; loaded?: boolean };
    const getApi = () => {
      if (api || isPreview()) return api;
      // Cal.com's documented loader: queues calls until embed.js has loaded.
      const w = window as unknown as { Cal?: CalApi };
      if (!w.Cal) {
        const push = (target: CalApi, args: unknown[]) => { (target.q = target.q || []).push(args); };
        const calFn: CalApi = function (...args: unknown[]) {
          const c = w.Cal!;
          if (!c.loaded) {
            c.ns = {};
            c.q = c.q || [];
            const script = document.createElement("script");
            script.src = "https://app.cal.com/embed/embed.js";
            script.async = true;
            script.addEventListener("error", () => cal.classList.add("is-failed"));
            document.head.appendChild(script);
            c.loaded = true;
          }
          if (args[0] === "init") {
            const nsApi: CalApi = function (...a: unknown[]) { push(nsApi, a); };
            const name = args[1];
            if (typeof name === "string") {
              c.ns![name] = c.ns![name] || nsApi;
              push(c.ns![name], args);
              push(c, ["initNamespace", name]);
            } else push(c, args);
            return;
          }
          push(c, args);
        };
        w.Cal = calFn;
      }
      const Cal = w.Cal!;
      Cal("init", ns, { origin: "https://app.cal.com" });
      // Pass ad tracking parameters (utm_*, fbclid, gclid) from the page URL through to the booking.
      const calCfg = Cal as unknown as { config?: Record<string, unknown> };
      calCfg.config = calCfg.config || {};
      calCfg.config.forwardQueryParams = true;
      const nsApi = Cal.ns![ns];
      nsApi("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: { light: { "cal-brand": "#000000" }, dark: { "cal-brand": "#A8D8FF" } },
      });
      // Hide the placeholder once the calendar is ready; show the link-out if it fails.
      nsApi("on", { action: "linkReady", callback: () => cal.classList.add("is-loaded") });
      nsApi("on", { action: "linkFailed", callback: () => cal.classList.add("is-failed") });
      // Schedule fires only on a completed booking (both event names exist across embed versions).
      const onBooked = () => {
        if (booked) booked.textContent = "You’re booked. Check your email for the confirmation and meeting details.";
        if (!scheduleSent) { scheduleSent = true; trackSchedule(answers); }
      };
      nsApi("on", { action: "bookingSuccessfulV2", callback: onBooked });
      nsApi("on", { action: "bookingSuccessful", callback: onBooked });
      api = nsApi;
      return api;
    };

    // Load embed.js only once the visitor starts the qualifier (first focus, tap or change on
    // any field). Two dropdowns take long enough that it's ready by "Show open times";
    // mountCalendar() calls getApi() too, so a submit without touching a field still works.
    const warm = () => {
      getApi();
      ["focusin", "pointerdown", "change"].forEach((t) => qualify.removeEventListener(t, warm));
    };
    ["focusin", "pointerdown", "change"].forEach((t) => qualify.addEventListener(t, warm, { passive: true }));

    // Prefill for Cal: "notes" fills the booking's Additional notes; metadata[...] is stored on the booking.
    const prefill = (a: QualifierAnswers): Record<string, string> => {
      const notes = [
        a.fit === "review" ? "[Review fit]" : "",
        `Trade: ${a.trade}`,
        `Monthly ad spend: ${a.ad_budget}`,
        a.goal ? `Wants more of: ${a.goal}` : "",
      ].filter(Boolean).join("\n");
      return {
        notes,
        "metadata[trade]": a.trade,
        "metadata[ad_budget]": a.ad_budget,
        "metadata[goal]": a.goal || "-",
        "metadata[fit]": a.fit,
      };
    };

    const mountCalendar = (a: QualifierAnswers) => {
      const fields = prefill(a);
      if (direct) {
        const url = new URL("https://cal.com/" + calLink);
        Object.entries(fields).forEach(([k, v]) => url.searchParams.set(k, v));
        direct.href = url.toString();
      }
      cal.classList.remove("is-locked", "is-loaded", "is-failed");
      const calApi = getApi();
      if (!calApi) { cal.classList.add("is-failed"); return; } // preview: show the link-out
      // A fresh mount each time, so changed answers re-render the calendar with the new prefill.
      const oldMount = cal.querySelector<HTMLElement>("[data-cal-mount]")!;
      const mount = oldMount.cloneNode(false) as HTMLElement;
      oldMount.replaceWith(mount);
      calApi("inline", {
        elementOrSelector: "#my-cal-inline-15min",
        calLink,
        config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", theme: "light", ...fields },
      });
      // If nothing has rendered after 12s (blocked script, slow network), offer the direct link.
      window.setTimeout(() => { if (!cal.classList.contains("is-loaded")) cal.classList.add("is-failed"); }, 12000);
    };

    const status = qualify.querySelector<HTMLElement>("[data-qualify-status]")!;
    const required = [...qualify.querySelectorAll<HTMLSelectElement>("select[required]")];
    const errorFor: Record<string, string> = { trade: "Choose your trade.", ad_budget: "Choose your monthly ad spend." };
    const validate = (sel: HTMLSelectElement) => {
      const msg = sel.value ? "" : errorFor[sel.name];
      sel.closest(".field")!.classList.toggle("has-error", Boolean(msg));
      sel.setAttribute("aria-invalid", msg ? "true" : "false");
      const err = qualify.querySelector(`#${sel.id}-err`);
      if (err) err.textContent = msg;
      return msg;
    };
    required.forEach((sel) => sel.addEventListener("change", () => validate(sel)));

    qualify.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = required.filter((sel) => validate(sel));
      if (invalid.length) { invalid[0].focus(); return; }

      const data = new FormData(qualify);
      const trade = String(data.get("trade"));
      const adBudget = String(data.get("ad_budget"));
      answers = {
        trade,
        ad_budget: adBudget,
        goal: String(data.get("goal") ?? "").trim(),
        // Nobody is turned away; these bookings are just tagged for a closer look.
        fit: trade === "Other home service" || adBudget === "Under $1,000" ? "review" : "good",
      };
      if (!leadSent) { leadSent = true; trackLead(answers); }
      mountCalendar(answers);
      status.textContent = "Open times are showing in the calendar.";
      // On phones the calendar sits below the questions; bring it into view.
      if (window.matchMedia("(max-width: 960px)").matches) {
        cal.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      }
    });
  }

  /* ------------------------------------------------------------------
     Copy-email buttons: always work, unlike mailto links (which open a blank
     page when no mail app is set up, and inside embedded previews)
     ------------------------------------------------------------------ */
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

  return () => {};
}
