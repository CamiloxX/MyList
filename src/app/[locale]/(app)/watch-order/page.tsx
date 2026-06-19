import { ArrowRightIcon, ClapperboardIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnimeIcon } from "@/features/discover/components/media-icons";
import { LibrarySearchInput } from "@/features/library/components/library-search-input";
import { PosterCard } from "@/features/library-v2/components/poster-card";
import { CURATED_FRANCHISES } from "@/features/library-v2/curated-franchises";
import type { PosterItem } from "@/features/library-v2/types";
import { Link } from "@/i18n/navigation";
import { jikanPoster, jikanTitle, searchJikan } from "@/lib/jikan/search";
import { tmdbImage } from "@/lib/tmdb/images";
import { searchTmdb, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";

export const dynamic = "force-dynamic";

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
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("franchisesHeading")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CURATED_FRANCHISES.map((franchise) => {
              const first = franchise.chronological[0];
              if (!first) return null;
              const Icon = franchise.category === "anime" ? AnimeIcon : ClapperboardIcon;
              return (
                <Link
                  key={franchise.id}
                  href={`/watch-order/${first.source}/${first.kind}/${first.sourceId}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-semibold">{franchise.name}</span>
                  </span>
                  <ArrowRightIcon
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
