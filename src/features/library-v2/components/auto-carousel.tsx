"use client";

import type { ReactNode } from "react";

type Props = {
  /** Server-rendered cards. Rendered twice (the second copy is decorative) so
   *  the CSS marquee can loop seamlessly. */
  children: ReactNode;
  /** Seconds for one full loop; lower = faster. Scales with item count upstream. */
  durationSeconds?: number;
};

/**
 * Continuously auto-scrolling row for the recommendations. No scrollbar — the
 * track translates via CSS (see globals.css `.mylist-marquee-track`) and pauses
 * on hover. Edges fade out so cards appear to drift in and out.
 */
export function AutoCarousel({ children, durationSeconds = 40 }: Props) {
  return (
    <div
      className="mylist-marquee group relative overflow-hidden"
      style={{ ["--marquee-duration" as string]: `${durationSeconds}s` }}
    >
      <div className="mylist-marquee-track flex w-max gap-4">
        <div className="flex shrink-0 gap-4 pr-4">{children}</div>
        <div className="flex shrink-0 gap-4 pr-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
