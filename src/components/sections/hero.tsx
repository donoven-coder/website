import type React from "react";
import Velaris from "@/components/ui/velaris";

// Monochrome palette for the WebGL background, kept outside the component so the
// shader effect isn't torn down and rebuilt on every render.
// The second color carries a trace of the sky accent so the hero ties into the palette.
const HERO_COLORS = ["#2f3338", "#4d5866", "#1a1a1a", "#000000"];

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title">
      <Velaris bg="#000000" colors={HERO_COLORS} speed={1.2} grain={0.4} height="auto" className="hero hero-dark">
        {/* Soft light that follows the cursor across the gradient (desktop only, see site-behaviors.ts) */}
        <div className="hero-cursor-light" aria-hidden="true" data-hero-light></div>
        <div className="wrap hero-inner">
          <h1 id="hero-title" className="hero-title">
            <span className="line"><span className="reveal-load" style={{ '--d': 0 } as React.CSSProperties}>More booked customers.</span></span>
            <span className="line line-soft"><span className="reveal-load" style={{ '--d': 1 } as React.CSSProperties}>Less wasted ad spend.</span></span>
          </h1>
          <p className="hero-lede reveal-load" style={{ '--d': 2 } as React.CSSProperties}>
            Ossmark Media runs Facebook, Instagram and Google ads for South Jersey businesses, built around one number: customers who actually booked.
          </p>
          <div className="hero-actions reveal-load" style={{ '--d': 3 } as React.CSSProperties}>
            <a className="btn btn-sky btn-lg" href="#book" data-cta="hero">Book your free discovery call</a>
            <a className="btn btn-line-light btn-lg" href="#process">See how it works</a>
          </div>
          <ul className="trust-row reveal-load" style={{ '--d': 4 } as React.CSSProperties}>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4.2l2.6 1.6"/></svg>15-minute Zoom call</li>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8"/></svg>No long-term contracts</li>
            <li><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s-5.5-5.2-5.5-9.3a5.5 5.5 0 0 1 11 0C15.5 12.8 10 18 10 18Z"/><circle cx="10" cy="8.6" r="1.9"/></svg>Based in South Jersey</li>
          </ul>
        </div>

        {/*
          REPLACE: founder video (VSL). Record a 60–90 second video: who you are, who you help, what the call covers.
          Then add <video> or a YouTube/Vimeo embed inside .hero-media and delete the map figure.
          Until then the panel shows the animated South Jersey map.
        */}
        <div className="wrap">
          <div className="hero-media reveal-panel" data-replace="Founder video (optional)">
            <figure className="hero-map" aria-labelledby="map-caption">
              <svg className="map" viewBox="0 0 400 520" role="img" aria-labelledby="map-title" data-map>
                <title id="map-title">Map of South Jersey towns Ossmark Media reaches, from Burlington County to Cape May</title>
              </svg>
            </figure>
            <div className="hero-media-copy">
              <p className="media-stat"><span className="serif">Burlington</span> to <span className="serif">Cape May</span></p>
              <p id="map-caption" className="media-caption">Ads targeted town by town, to the customers who can actually reach you.</p>
              <a className="btn btn-light" href="#book" data-cta="panel">Book a call</a>
            </div>
          </div>
        </div>
      </Velaris>
    </section>
  );
}
