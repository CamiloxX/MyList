import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PosterItem } from "../types";
import { AutoCarousel } from "./auto-carousel";
import { PosterCard } from "./poster-card";

type Props = {
  /** Optional heading; omit it for a bare carousel under an existing title. */
  title?: string;
  items: PosterItem[];
  /** Optional "see all" target rendered next to the heading. */
  seeAllHref?: string;
  seeAllLabel?: string;
  /** Shown when there are no items (keeps the section from collapsing). */
  emptyLabel?: string;
};

/**
 * Recommendations row rendered as a self-scrolling marquee (no scrollbar). The
 * cards are server-rendered and handed to the client AutoCarousel as children;
 * loop speed scales with how many there are so a short list isn't dizzyingly
 * fast nor a long one sluggish.
 */
export function CarouselRow({ title, items, seeAllHref, seeAllLabel, emptyLabel }: Props) {
  return (
    <section className="flex flex-col gap-3">
      {title || seeAllHref ? (
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {seeAllLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <AutoCarousel durationSeconds={Math.max(20, items.length * 4)}>
          {items.map((item) => (
            <div key={item.key} className="w-[200px] shrink-0">
              {/* PosterCard is async; awaited per item by the RSC renderer. */}
              <PosterCard item={item} />
            </div>
          ))}
        </AutoCarousel>
      )}
    </section>
  );
}
