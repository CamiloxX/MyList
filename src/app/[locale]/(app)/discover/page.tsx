import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscoverFilters } from "@/features/discover/components/discover-filters";
import { DiscoverGrid } from "@/features/discover/components/discover-grid";
import { DiscoverTabs } from "@/features/discover/components/discover-tabs";
import { MediaTypeTabs } from "@/features/discover/components/media-type-tabs";
import { PaginationControls } from "@/features/discover/components/pagination-controls";
import { fetchProvidersForTmdbItems } from "@/features/discover/providers";
import {
  getByGenreFor,
  getGenresFor,
  getProvidersFor,
  getTrendingFor,
} from "@/features/discover/queries";
import { fetchRatingsForTmdbItems } from "@/features/discover/ratings";
import { getForYou } from "@/features/discover/recommend";
import {
  type DiscoverRegion,
  type DiscoverTab,
  type DiscoverType,
  discoverFiltersSchema,
} from "@/features/discover/schemas";
import { getLibraryItemKeys, libraryItemKey } from "@/features/library/queries";
import { ForYouCarousels } from "@/features/library-v2/components/for-you-carousels";
import { AnimeCard } from "@/features/search/components/anime-card";
import { MediaCard } from "@/features/search/components/media-card";
import { isMobileUserAgent } from "@/lib/device";
import { loadingDemoDelay } from "@/lib/loading-demo";

export const dynamic = "force-dynamic";

/**
 * TMDB and Jikan return up to 20-25 items per page. We use the result count
 * as a heuristic for "is there a next page?" — works for the prev/next UX.
 */
const PAGE_SIZE_THRESHOLD = 20;

type DiscoverPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  await loadingDemoDelay();
  const raw = await searchParams;
  const filters = discoverFiltersSchema.parse({
    tab: raw.tab,
    type: raw.type,
    genre: raw.genre,
    year: raw.year,
    provider: raw.provider,
    region: raw.region,
    page: raw.page,
  });
  const t = await getTranslations("discover");
  const showStreamingFilters = filters.type !== "anime" && filters.tab !== "for-you";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <DiscoverTabs current={filters.tab} />

      {filters.tab === "for-you" ? (
        <Suspense key={`for-you:${filters.region}`} fallback={<MultiSectionSkeleton />}>
          <ForYouSection region={filters.region} />
        </Suspense>
      ) : (
        <>
          {/* On desktop, type tabs and the filters trigger share one toolbar
              row; on mobile they stay stacked exactly as before. */}
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <MediaTypeTabs current={filters.type} />

            <Suspense
              key={`filters:${filters.type}:${filters.region}:${filters.tab}`}
              fallback={<FilterSkeleton />}
            >
              <FiltersBar
                showGenre={filters.tab === "genre"}
                showStreaming={showStreamingFilters}
                type={filters.type}
                region={filters.region}
                currentGenre={filters.genre}
                currentProvider={filters.provider}
              />
            </Suspense>
          </div>

          <Suspense
            key={`${filters.tab}:${filters.type}:${filters.genre ?? ""}:${filters.provider ?? ""}:${filters.region}:${filters.page}`}
            fallback={<ResultsSkeleton />}
          >
            <ResultsSection
              tab={filters.tab}
              type={filters.type}
              genre={filters.genre}
              year={filters.year}
              provider={filters.provider}
              region={filters.region}
              page={filters.page}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

async function ResultsSection({
  tab,
  type,
  genre,
  year,
  provider,
  region,
  page,
}: {
  tab: Exclude<DiscoverTab, "for-you">;
  type: DiscoverType;
  genre: number | undefined;
  year: number | undefined;
  provider: number | undefined;
  region: DiscoverRegion;
  page: number;
}) {
  const list =
    tab === "trending"
      ? await getTrendingFor(type, { page, region, provider })
      : await getByGenreFor(type, genre, year, { page, region, provider });
  const hasMore = list.items.length >= PAGE_SIZE_THRESHOLD;

  return (
    <>
      <DiscoverGrid list={list} region={region} />
      <PaginationControls page={page} hasMore={hasMore} />
    </>
  );
}

async function FiltersBar({
  showGenre,
  showStreaming,
  type,
  region,
  currentGenre,
  currentProvider,
}: {
  showGenre: boolean;
  showStreaming: boolean;
  type: DiscoverType;
  region: DiscoverRegion;
  currentGenre: number | undefined;
  currentProvider: number | undefined;
}) {
  // Both lookups are cheap and cached at TMDB level. Skip whichever isn't
  // relevant to the current tab to avoid wasted requests (e.g., anime tab
  // has no providers; trending tab doesn't need a genre list).
  const [genres, providers] = await Promise.all([
    showGenre ? getGenresFor(type) : Promise.resolve([]),
    showStreaming && type !== "anime"
      ? getProvidersFor(type as Exclude<DiscoverType, "anime">, region)
      : Promise.resolve([]),
  ]);

  return (
    <DiscoverFilters
      showGenre={showGenre}
      showStreaming={showStreaming}
      genres={genres}
      providers={providers}
      currentGenre={currentGenre}
      currentRegion={region}
      currentProvider={currentProvider}
    />
  );
}

async function ForYouSection({ region }: { region: DiscoverRegion }) {
  const t = await getTranslations("discover.forYou");
  const result = await getForYou();
  const isEmpty = result.movies.length === 0 && result.tv.length === 0 && result.anime.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const fallbackNotice = result.fallback ? (
    <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
      {t("fallbackNotice")}
    </div>
  ) : null;

  // Desktop renders the v2 auto-scrolling carousels (same look the library had);
  // mobile keeps the existing enriched card lists exactly as before.
  if (!isMobileUserAgent((await headers()).get("user-agent"))) {
    return (
      <div className="flex flex-col gap-6">
        {fallbackNotice}
        <ForYouCarousels result={result} />
      </div>
    );
  }

  // Enrich TMDB items with OMDb ratings and watch providers in a parallel pass.
  const tmdbItems = [...result.movies, ...result.tv];
  const [ratings, providers, libraryKeys] = await Promise.all([
    fetchRatingsForTmdbItems(tmdbItems),
    fetchProvidersForTmdbItems(tmdbItems, region),
    getLibraryItemKeys(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {fallbackNotice}

      {result.movies.length > 0 ? (
        <Section heading={t("sectionMovies")}>
          <ul className="flex flex-col gap-3">
            {result.movies.map((item) => (
              <li key={`movie-${item.id}`}>
                <MediaCard
                  item={item}
                  ratings={ratings.get(item.id) ?? null}
                  providers={providers.get(item.id) ?? null}
                  alreadyAdded={libraryKeys.has(
                    libraryItemKey({ source: "tmdb", sourceId: String(item.id), kind: "movie" }),
                  )}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.tv.length > 0 ? (
        <Section heading={t("sectionTv")}>
          <ul className="flex flex-col gap-3">
            {result.tv.map((item) => (
              <li key={`tv-${item.id}`}>
                <MediaCard
                  item={item}
                  ratings={ratings.get(item.id) ?? null}
                  providers={providers.get(item.id) ?? null}
                  alreadyAdded={libraryKeys.has(
                    libraryItemKey({ source: "tmdb", sourceId: String(item.id), kind: "tv" }),
                  )}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {result.anime.length > 0 ? (
        <Section heading={t("sectionAnime")}>
          <ul className="flex flex-col gap-3">
            {result.anime.map((item) => (
              <li key={`anime-${item.mal_id}`}>
                <AnimeCard
                  item={item}
                  alreadyAdded={libraryKeys.has(
                    libraryItemKey({
                      source: "anilist",
                      sourceId: String(item.mal_id),
                      kind: "anime",
                    }),
                  )}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      {children}
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
        <li key={index} className="flex gap-4 rounded-xl border bg-card p-3">
          <Skeleton className="aspect-[2/3] w-24 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FilterSkeleton() {
  return <Skeleton className="h-12 w-40 rounded-lg" />;
}

function MultiSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
        <section key={sectionIndex} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <ResultsSkeleton />
        </section>
      ))}
    </div>
  );
}
