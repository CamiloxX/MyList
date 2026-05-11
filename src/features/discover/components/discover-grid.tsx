import { getTranslations } from "next-intl/server";
import { AnimeCard } from "@/features/search/components/anime-card";
import { MediaCard } from "@/features/search/components/media-card";
import type { DiscoverList } from "../queries";

type Props = {
  list: DiscoverList;
  /** When the list is empty, this message is shown inside a dashed empty state. */
  emptyMessage?: string;
};

/**
 * Renders a Discover result list using the same cards the Search feature uses,
 * so adding a title to the library is a one-tap action everywhere.
 */
export async function DiscoverGrid({ list, emptyMessage }: Props) {
  const t = await getTranslations("discover");
  const fallback = emptyMessage ?? t("emptyResults");

  if (list.kind === "tmdb") {
    if (list.items.length === 0) return <EmptyState message={fallback} />;
    return (
      <ul className="flex flex-col gap-3">
        {list.items.map((item) => (
          <li key={`${item.media_type}-${item.id}`}>
            <MediaCard item={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (list.items.length === 0) return <EmptyState message={fallback} />;
  return (
    <ul className="flex flex-col gap-3">
      {list.items.map((item) => (
        <li key={`jikan-${item.mal_id}`}>
          <AnimeCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
