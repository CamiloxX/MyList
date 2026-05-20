import { cn } from "@/lib/utils";

/**
 * MyList brand mark. Renders the official logo PNG from /public; the file
 * already includes rounded corners, so no clipping is applied here.
 *
 * Kept as a thin wrapper instead of inlining an <img> at every call site so
 * future changes (swap to <Image>, add a dark variant, etc.) happen in one
 * place.
 */
export function BrandMark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: server-component-friendly and avoids next/image sizing quirks for the brand mark
    <img
      src="/iconomylist.png"
      alt="MyList"
      width={size}
      height={size}
      decoding="async"
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
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
