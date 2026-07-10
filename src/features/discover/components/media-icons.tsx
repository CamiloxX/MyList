import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/**
 * Stylized "anime eye": a tall almond shape with a vertical pupil and two
 * highlights. Lucide doesn't ship anything that reads as "anime" at small
 * sizes, so we draw a recognizable shorthand inline. Uses currentColor so it
 * inherits text color from the parent (active tab vs muted).
 */
export function AnimeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <title>Anime</title>
      <path
        d="M3 12 C 6 5, 18 5, 21 12 C 18 19, 6 19, 3 12 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="12" rx="3.2" ry="5" fill="currentColor" />
      <ellipse cx="13.4" cy="9.6" rx="0.9" ry="1.3" fill="white" />
      <ellipse cx="10.8" cy="13.8" rx="0.5" ry="0.7" fill="white" />
    </svg>
  );
}
