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
  className,
}: {
  coverUrl: string | null;
  seed: string;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={coverUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 640px, 100vw"
          className="object-cover"
        />
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
