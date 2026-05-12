"use client";

import { useEffect, useState } from "react";
import { Particles } from "@/components/ui/particles";

/**
 * Mounts the Particles canvas as a fixed full-viewport background. Lives
 * behind everything (`-z-10`) and never captures pointer events. Theme is
 * detected via `prefers-color-scheme` because the project's ThemeProvider is
 * a no-op pass-through and color is decided in CSS — so we mirror that here.
 *
 * White-ish particles read against the dark theme, slate-700 reads against
 * the light theme. Both have low alpha so they stay subtle and don't compete
 * with content.
 */
export function BackgroundParticles() {
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setColor(mq.matches ? "#ffffff" : "#334155");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Particles
      className="fixed inset-0 -z-10 h-screen w-screen"
      quantity={90}
      ease={70}
      color={color}
      refresh
    />
  );
}
