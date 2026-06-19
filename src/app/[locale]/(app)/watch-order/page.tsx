import { getTranslations } from "next-intl/server";
import { LibrarySearchInput } from "@/features/library/components/library-search-input";
import { FranchiseCard } from "@/features/library-v2/components/franchise-card";
import { PosterCard } from "@/features/library-v2/components/poster-card";
import { FRANCHISE_ENTRY_DATA } from "@/features/library-v2/curated-franchise-data";
import { CURATED_FRANCHISES } from "@/features/library-v2/curated-franchises";
import type { PosterItem } from "@/features/library-v2/types";
import { jikanPoster, jikanTitle, searchJikan } from "@/lib/jikan/search";
import { tmdbImage } from "@/lib/tmdb/images";
import { searchTmdb, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";

export const dynamic = "force-dynamic";

// Movies first, then anime — the two categories the curated list ships today.
const CATEGORY_ORDER = ["movie", "anime"] as const;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * Dedicated "watch order" mode: pick a curated franchise or search any movie /
 * anime and jump to its ordered list. Only movie + anime are searchable here
 * (TV has no cross-series order).
 */
export default async function WatchOrderIndexPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const t = await getTranslations("libraryV2.watchOrder");

  let results: PosterItem[] = [];
  if (query) {
    const [tmdb, anime] = await Promise.all([
      searchTmdb(query).catch(() => []),
      searchJikan(query).catch(() => []),
    ]);
    const movies: PosterItem[] = tmdb
      .filter((item) => item.media_type === "movie")
      .slice(0, 10)
      .map((m) => ({
        key: `movie-${m.id}`,
        title: tmdbTitle(m),
        posterUrl: tmdbImage(m.poster_path, "w342"),
        kind: "movie",
        meta: tmdbYear(m) ? String(tmdbYear(m)) : undefined,
        href: `/watch-order/tmdb/movie/${m.id}`,
      }));
    const animes: PosterItem[] = anime.slice(0, 10).map((a) => ({
      key: `anime-${a.mal_id}`,
      title: jikanTitle(a),
      posterUrl: jikanPoster(a),
      kind: "anime",
      meta: a.year ? String(a.year) : undefined,
      href: `/watch-order/anilist/anime/${a.mal_id}`,
    }));
    results = [...movies, ...animes];
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
      </header>

      <LibrarySearchInput defaultValue={query} placeholder={t("searchPlaceholder")} />

      {query ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
          {results.map((item) => (
            <PosterCard key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("franchisesHeading")}</h2>
          {CATEGORY_ORDER.map((category) => {
            const list = CURATED_FRANCHISES.filter((f) => f.category === category);
            if (list.length === 0) return null;
            return (
              <div key={category} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`categories.${category}`)}
                </h3>
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                  {list.map((franchise) => {
                    const first = franchise.chronological[0];
                    if (!first) return null;
                    return (
                      <FranchiseCard
                        key={franchise.id}
                        href={`/watch-order/${first.source}/${first.kind}/${first.sourceId}`}
                        name={franchise.name}
                        posterUrl={
                          FRANCHISE_ENTRY_DATA[`${first.source}:${first.kind}:${first.sourceId}`]
                            ?.posterUrl ?? null
                        }
                        count={franchise.chronological.length}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
