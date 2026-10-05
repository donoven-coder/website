import React, { useEffect, useRef, type ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'white' | 'sky';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean; // When true, ignores size prop and uses width/height or className
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  // Ossmark: neutral silver glow (saturation is set to 0 below) to match the monochrome brand.
  white: { base: 0, spread: 0 },
  // Ossmark: the site's baby-blue accent, held at one hue instead of shifting across the screen.
  sky: { base: 207, spread: 0 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

// Ossmark: one shared pointer listener for every card instead of one per card, attached
// only while a card is on screen. Card positions are measured in a ResizeObserver callback
// (after layout, so no forced reflow), and each frame only the cards near the pointer are
// restyled: the spotlight is 200px, so a card further away than that shows no glow anyway.
type GlowEntry = { el: HTMLDivElement; box: { top: number; left: number; width: number; height: number } | null; lit: boolean; visible: boolean };
const glowCards = new Set<GlowEntry>();
const GLOW_RANGE = 260;
let glowX = -1e4, glowY = -1e4, glowFrame = 0, glowListening = false;
let glowRO: ResizeObserver | null = null;
let glowIO: IntersectionObserver | null = null;

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
    c.el.style.setProperty('--x', glowX.toFixed(2));
    c.el.style.setProperty('--xp', (glowX / window.innerWidth).toFixed(2));
    c.el.style.setProperty('--y', glowY.toFixed(2));
    c.el.style.setProperty('--yp', (glowY / window.innerHeight).toFixed(2));
  });
};

const onGlowPointer = (e: PointerEvent) => {
  glowX = e.clientX;
  glowY = e.clientY;
  if (!glowFrame) glowFrame = requestAnimationFrame(applyGlow);
};

const syncGlowListener = () => {
  const any = [...glowCards].some((c) => c.visible);
  if (any && !glowListening) document.addEventListener('pointermove', onGlowPointer, { passive: true });
  if (!any && glowListening) document.removeEventListener('pointermove', onGlowPointer);
  glowListening = any;
};

function registerGlowCard(el: HTMLDivElement) {
  if (!glowRO) {
    glowRO = new ResizeObserver(measureGlowCards);
    glowRO.observe(document.body);
    glowIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => glowCards.forEach((c) => { if (c.el === e.target) c.visible = e.isIntersecting; }));
      syncGlowListener();
    });
  }
  const entry: GlowEntry = { el, box: null, lit: false, visible: false };
  glowCards.add(entry);
  glowRO.observe(el);
  glowIO!.observe(el);
  return () => {
    glowCards.delete(entry);
    glowRO?.unobserve(el);
    glowIO?.unobserve(el);
    syncGlowListener();
    if (!glowCards.size) cancelAnimationFrame(glowFrame);
  };
}

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    return registerGlowCard(el);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  // Determine sizing
  const getSizeClasses = () => {
    if (customSize) {
      return ''; // Let className or inline styles handle sizing
    }
    return sizeMap[size];
  };

  const getInlineStyles = (): React.CSSProperties => {
    // Ossmark: typed loosely so CSS custom properties and the optional width/height
    // below compile under strict TypeScript (the original object literal type rejected them).
    const baseStyles: Record<string, string | number> = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '3',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      // Ossmark: was 'none', which blocked page scrolling on phones when a finger started on a card.
      touchAction: 'pan-y',
    };

    if (glowColor === 'white') {
      baseStyles['--saturation'] = '0';
    }

    // Add width and height if provided
    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles as React.CSSProperties;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }

    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }

    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }

    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }

    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;

  return (
    <>
      {/* Ossmark: React 19 hoists and de-duplicates <style href precedence>, so all cards share one copy */}
      <style href="glow-card-styles" precedence="default">{beforeAfterStyles}</style>
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl
          relative
          grid
          grid-rows-[1fr_auto]
          shadow-[0_1rem_2rem_-1rem_black]
          p-4
          gap-4
          backdrop-blur-[5px]
          ${className}
        `}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  );
};

export { GlowCard }
