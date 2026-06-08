import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PosterItem } from "../types";
import { PosterCard } from "./poster-card";

type Props = {
  title: string;
  items: PosterItem[];
  /** Optional "see all" target rendered next to the heading. */
  seeAllHref?: string;
  seeAllLabel?: string;
  /** Shown when there are no items (keeps the section from collapsing). */
  emptyLabel?: string;
};

/**
 * Horizontally scrollable row of poster cards. CSS scroll-snap keeps it a pure
 * server component (no client JS); on touch/trackpad it swipes, on desktop the
 * mouse wheel + scrollbar work. Each card has a fixed width so the row reads as
 * a carousel rather than wrapping into a grid.
 */
export function CarouselRow({ title, items, seeAllHref, seeAllLabel, emptyLabel }: Props) {
  return (
    <section className="flex flex-col gap-3">
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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {items.map((item) => (
            <div key={item.key} className="w-[150px] shrink-0 snap-start">
              {/* PosterCard is async; awaited per item by the RSC renderer. */}
              <PosterCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
