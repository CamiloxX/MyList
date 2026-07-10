"use client";

// Client component: lottie-react relies on lottie-web, which needs the DOM.
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";
import animationData from "./mylist-loader.json";

type Props = {
  /** Square render size in pixels. */
  size?: number;
  className?: string;
};

/**
 * Plays the MyList brand loader (newloader.json) — five purple dots orbiting
 * the center in a staggered spiral. Loops forever; purely decorative so it is
 * hidden from assistive tech (the surrounding status region carries the label).
 */
export function LottieLoader({ size = 180, className }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
