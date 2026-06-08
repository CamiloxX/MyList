import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { PosterTransitionLink } from "@/features/library/components/poster-transition-link";
import { cn } from "@/lib/utils";
import type { PosterItem } from "../types";

/**
 * Poster tile used across the desktop prototype (recommendations carousel,
 * genre browse, "Mi Biblioteca" grid). Reuses the app's theme tokens — no
 * bespoke palette — so it inherits light/dark automatically.
 */
export async function PosterCard({ item }: { item: PosterItem }) {
  const t = await getTranslations();

  const body = (
    <>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={t("posters.alt", { title: item.title })}
            fill
            sizes="(max-width: 768px) 40vw, 180px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
            {t("common.noPoster")}
          </div>
        )}
        <span className="absolute left-2 top-2">
          <Badge variant="secondary" className="bg-background/75 backdrop-blur">
            {t(`kinds.${item.kind}`)}
          </Badge>
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
        {item.meta ? <p className="truncate text-xs text-muted-foreground">{item.meta}</p> : null}
      </div>
    </>
  );

  const className = cn("group block focus:outline-none");

  if (item.href) {
    return (
      <PosterTransitionLink href={item.href} className={className}>
        {body}
      </PosterTransitionLink>
    );
  }
  return <div className={className}>{body}</div>;
}
