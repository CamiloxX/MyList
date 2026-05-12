import { getTranslations } from "next-intl/server";
import { getLibraryItemKeys, libraryItemKey } from "@/features/library/queries";
import { searchJikan } from "@/lib/jikan/search";
import { AnimeCard } from "./anime-card";

export async function AnimeResults({ query }: { query: string }) {
  const t = await getTranslations("search");

  // Jikan/MyAnimeList is a free third-party service that frequently returns
  // 5xx when MAL is degraded. Treat any failure as "temporarily unavailable"
  // so the rest of the search page keeps working.
  let results: Awaited<ReturnType<typeof searchJikan>>;
  try {
    results = await searchJikan(query);
  } catch {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("animeUnavailable")}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("noResultsAnime", { query })}</p>
      </div>
    );
  }

  const libraryKeys = await getLibraryItemKeys();

  return (
    <ul className="flex flex-col gap-3">
      {results.map((item) => (
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
