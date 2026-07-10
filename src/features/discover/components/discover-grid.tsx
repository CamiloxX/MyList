import { getTranslations } from "next-intl/server";
import { getLibraryItemKeys, libraryItemKey } from "@/features/library/queries";
import { AnimeCard } from "@/features/search/components/anime-card";
import { MediaCard } from "@/features/search/components/media-card";
import { fetchProvidersForTmdbItems } from "../providers";
import type { DiscoverList } from "../queries";
import { fetchRatingsForTmdbItems } from "../ratings";

type Props = {
  list: DiscoverList;
  /** ISO region code for streaming-provider lookups (e.g. "CO"). */
  region: string;
  /** When the list is empty, this message is shown inside a dashed empty state. */
  emptyMessage?: string;
};

/**
 * Renders a Discover result list using the same cards the Search feature uses,
 * so adding a title to the library is a one-tap action everywhere. For TMDB
 * lists, OMDb ratings and TMDB watch providers are fetched in parallel and
 * passed to each MediaCard; both lookups short-circuit gracefully when the
 * data isn't available (no key, no availability in region, network error).
 */
export async function DiscoverGrid({ list, region, emptyMessage }: Props) {
  const t = await getTranslations("discover");
  const fallback = emptyMessage ?? t("emptyResults");

  if (list.kind === "tmdb") {
    if (list.items.length === 0) return <EmptyState message={fallback} />;
    const [ratings, providers, libraryKeys] = await Promise.all([
      fetchRatingsForTmdbItems(list.items),
      fetchProvidersForTmdbItems(list.items, region),
      getLibraryItemKeys(),
    ]);
    return (
      <ul className="flex flex-col gap-3">
        {list.items.map((item) => (
          <li key={`${item.media_type}-${item.id}`}>
            <MediaCard
              item={item}
              ratings={ratings.get(item.id) ?? null}
              providers={providers.get(item.id) ?? null}
              alreadyAdded={libraryKeys.has(
                libraryItemKey({
                  source: "tmdb",
                  sourceId: String(item.id),
                  kind: item.media_type,
                }),
              )}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (list.items.length === 0) return <EmptyState message={fallback} />;
  const libraryKeys = await getLibraryItemKeys();
  return (
    <ul className="flex flex-col gap-3">
      {list.items.map((item) => (
        <li key={`jikan-${item.mal_id}`}>
          <AnimeCard
            item={item}
            alreadyAdded={libraryKeys.has(
              libraryItemKey({ source: "anilist", sourceId: String(item.mal_id), kind: "anime" }),
            )}
          />
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
