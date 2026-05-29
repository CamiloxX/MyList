import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { AddToListButton } from "@/features/lists/components/add-to-list-button";
import type { Database } from "@/types/database";
import type { MediaStatus } from "../status";
import { PosterTransitionLink } from "./poster-transition-link";
import { RemoveButton } from "./remove-button";
import { StatusSelect } from "./status-select";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

export async function LibraryCard({ item }: { item: MediaItem }) {
  const t = await getTranslations();
  return (
    <article className="flex gap-4 rounded-xl border bg-card p-3 shadow-sm">
      <PosterTransitionLink
        href={`/library/${item.id}`}
        className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={t("posters.alt", { title: item.title })}
            fill
            sizes="80px"
            className="object-cover"
            style={{ viewTransitionName: `poster-${item.id}` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            {t("common.noPoster")}
          </div>
        )}
      </PosterTransitionLink>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <PosterTransitionLink
              href={`/library/${item.id}`}
              className="truncate text-base font-medium hover:underline"
            >
              {item.title}
            </PosterTransitionLink>
            <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
            {item.year ? <span className="text-sm text-muted-foreground">{item.year}</span> : null}
          </div>
          {item.original_title && item.original_title !== item.title ? (
            <p className="truncate text-xs text-muted-foreground">{item.original_title}</p>
          ) : null}
        </header>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <StatusSelect id={item.id} current={item.status as MediaStatus} />
          <AddToListButton mediaItemId={item.id} variant="icon" />
          <RemoveButton id={item.id} title={item.title} />
        </div>
      </div>
    </article>
  );
}
