import { cn } from "@/lib/utils";

/**
 * MyList brand mark (Concept A from the Logo Exploration).
 * Rounded square with a vertical gradient (#A855F7 → #5B21B6), a soft-white
 * play triangle, and a deep-purple check inside the triangle.
 */
export function BrandMark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="MyList"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>MyList</title>
      <defs>
        <linearGradient id="mylist-brand-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#mylist-brand-gradient)" />
      <path d="M22 20 L22 44 L44 32 Z" fill="#F8FAFC" />
      <path
        d="M28 32 L31 35 L38 27"
        stroke="#5B21B6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * "my" + accented "list" wordmark, using the display font (Bricolage Grotesque).
 *
 * Variants:
 * - `auto` (default): adapts to the surrounding theme — `text-foreground`
 *   for "my", `text-primary` for "list". Use anywhere a normal surface
 *   background is in play (header, mobile auth heading, etc.).
 * - `on-brand`: explicit white "my" + bright lilac "list" — for placement
 *   on the purple gradient panel.
 */
export function Wordmark({
  size = 26,
  variant = "auto",
  className,
}: {
  size?: number;
  variant?: "auto" | "on-brand";
  className?: string;
}) {
  const isOnBrand = variant === "on-brand";
  return (
    <span
      className={cn(
        "font-display font-extrabold leading-none",
        isOnBrand ? "text-white" : "text-foreground",
        className,
      )}
      style={{
        fontSize: size,
        letterSpacing: "-0.04em",
      }}
    >
      my
      <span
        className={isOnBrand ? "" : "text-primary"}
        style={isOnBrand ? { color: "#A855F7" } : undefined}
      >
        list
      </span>
    </span>
  );
}
