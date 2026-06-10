import { ListIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Deterministic hue (0-359) from a list id, so each default cover is stable. */
function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
}

/**
 * Presentational cover banner: the uploaded image, or a generated gradient
 * default keyed to the list id. Plain (non-client) so it works in both server
 * pages and the client editor.
 */
export function ListCover({
  coverUrl,
  seed,
  posterUrls = [],
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
}: {
  coverUrl: string | null;
  seed: string;
  /** Posters used to build a collage default when there's no uploaded cover. */
  posterUrls?: string[];
  className?: string;
  /** Rendered width hint for next/image, so it serves a sharp source. Should
   *  match the cover's on-screen width; defaults to a 2-column grid card. */
  sizes?: string;
}) {
  if (coverUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image src={coverUrl} alt="" fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  // No uploaded cover but the list has titles: stitch their posters into a strip.
  const collage = posterUrls.slice(0, 4);
  if (collage.length > 0) {
    return (
      <div className={cn("relative flex overflow-hidden bg-muted", className)}>
        {collage.map((url) => (
          <div key={url} className="relative flex-1">
            <Image src={url} alt="" fill sizes={sizes} className="object-cover" />
          </div>
        ))}
      </div>
    );
  }

  const hue = hueFromId(seed);
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 58% 46%), hsl(${(hue + 45) % 360} 64% 34%))`,
      }}
    >
      <ListIcon className="size-8 text-white/70" aria-hidden />
    </div>
  );
}
