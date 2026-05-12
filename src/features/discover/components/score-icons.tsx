/**
 * Inline SVG icons for review aggregators. Hand-drawn shapes that evoke
 * each service's visual identity without literally copying their assets:
 *   - TomatoIcon: red splat for "fresh" (≥60%), green for "rotten".
 *   - ImdbWordmark: yellow rounded tile with "IMDb" wordmark.
 *   - MetacriticTile: rounded color tile with a bold "M". Color follows
 *     Metacritic's official semaphore (green / yellow / red).
 */

import { cn } from "@/lib/utils";

type IconProps = { className?: string };

export function TomatoIcon({
  fresh,
  className,
}: IconProps & { fresh: boolean }) {
  if (!fresh) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={cn("shrink-0", className)}
      >
        <title>Rotten Tomatoes (rotten)</title>
        <path
          d="M5 14 Q3.5 10 7 8 Q9.5 4 14 6 Q18.5 4.5 20 10 Q22 13.5 19 16 Q18 21 12 19 Q5.5 20.5 5 14 Z"
          fill="#65a30d"
        />
        <circle cx="9.5" cy="11.5" r="1.4" fill="#3f6212" opacity="0.55" />
        <circle cx="15" cy="14" r="1" fill="#3f6212" opacity="0.55" />
        <circle cx="13" cy="9" r="0.8" fill="#3f6212" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <title>Rotten Tomatoes (fresh)</title>
      <path
        d="M9 4.5 C9 6.2 10.2 7 12 7 C13.8 7 15 6.2 15 4.5 C15 6 13.8 6.6 12 6.6 C10.2 6.6 9 6 9 4.5 Z"
        fill="#16a34a"
      />
      <path d="M11.4 3 L12.6 3 L12.4 7 L11.6 7 Z" fill="#16a34a" />
      <circle cx="12" cy="14" r="8" fill="#dc2626" />
      <ellipse cx="9" cy="11.5" rx="1.6" ry="2.2" fill="#fca5a5" opacity="0.55" />
    </svg>
  );
}

export function ImdbWordmark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 36 16"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <title>IMDb</title>
      <rect width="36" height="16" rx="2.5" fill="#f5c518" />
      <text
        x="18"
        y="11.5"
        fontFamily="system-ui, sans-serif"
        fontSize="9"
        fontWeight="900"
        textAnchor="middle"
        fill="#000"
        letterSpacing="-0.3"
      >
        IMDb
      </text>
    </svg>
  );
}

export function MetacriticTile({
  value,
  className,
}: IconProps & { value: number }) {
  const fill = value >= 75 ? "#36b37e" : value >= 50 ? "#ffbd3f" : "#ff6874";
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <title>Metacritic</title>
      <rect width="16" height="16" rx="3" fill={fill} />
      <text
        x="8"
        y="12"
        fontFamily="system-ui, sans-serif"
        fontSize="10"
        fontWeight="900"
        textAnchor="middle"
        fill="#fff"
      >
        M
      </text>
    </svg>
  );
}
