import { useEffect, useRef } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

// Ossmark: CSS-only take on the original Velaris WebGL background. The shader compiled
// on the main thread (~0.5s on a mid phone) and redrew every frame; here three soft color
// fields drift with transform-only animations, which the compositor runs off the main
// thread. Same structure as the shader: color fields, a center glow, a vignette sized
// from the hero's height, and grain (still, not per-frame). Styles: site.css "Hero background".

export interface VelarisProps {
  bg?: string;
  /** [field 1, field 2 (also the center glow), field 3, deep shadow] */
  colors?: string[];
  /** Higher is faster; 1 = a ~22s drift cycle */
  speed?: number;
  /** Grain strength, 0 to 1 */
  grain?: number;
  height?: string;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_COLORS = ["#86efac", "#4ade80", "#059669", "#000000"];

const Velaris = ({
  bg = "#000000",
  colors = DEFAULT_COLORS,
  speed = 1,
  grain = 0.3,
  height = "100vh",
  className,
  children,
}: VelarisProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The vignette and glow are sized from the hero's height, as in the shader.
    // ResizeObserver reports the size after layout, so this never forces a reflow.
    const ro = new ResizeObserver(([entry]) => {
      container.style.setProperty("--vl-h", `${Math.round(entry.contentRect.height)}px`);
    });
    ro.observe(container);

    // Drift only while the hero is on screen and the tab is visible.
    let onScreen = true;
    const sync = () => container.classList.toggle("is-paused", !onScreen || document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(container);
    document.addEventListener("visibilitychange", sync);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const style = {
    height,
    backgroundColor: bg,
    "--vl-c0": colors[0],
    "--vl-c1": colors[1],
    "--vl-c2": colors[2],
    "--vl-c3": colors[3] ?? bg,
    "--vl-speed": String(speed),
    "--vl-grain": String(grain),
  } as React.CSSProperties;

  return (
    <div ref={containerRef} style={style} className={cn("velaris relative w-full overflow-hidden", className)}>
      <div className="velaris-bg" aria-hidden="true">
        <span className="vl-field vl-f0" />
        <span className="vl-field vl-f1" />
        <span className="vl-field vl-f2" />
        <span className="vl-glow" />
        <span className="vl-vignette" />
        <span className="vl-grain" />
      </div>
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Velaris;
