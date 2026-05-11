import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscoverGrid } from "@/features/discover/components/discover-grid";
import { DiscoverTabs } from "@/features/discover/components/discover-tabs";
import { GenreFilter } from "@/features/discover/components/genre-filter";
import { MediaTypeTabs } from "@/features/discover/components/media-type-tabs";
import { PaginationControls } from "@/features/discover/components/pagination-controls";
import { ProviderFilter } from "@/features/discover/components/provider-filter";
import { RegionFilter } from "@/features/discover/components/region-filter";
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
import { AnimeCard } from "@/features/search/components/anime-card";
import { MediaCard } from "@/features/search/components/media-card";

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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <DiscoverTabs current={filters.tab} />

      {filters.tab === "for-you" ? (
        <Suspense key="for-you" fallback={<MultiSectionSkeleton />}>
          <ForYouSection />
        </Suspense>
      ) : (
        <>
          <MediaTypeTabs current={filters.type} />

          <div className="flex flex-wrap items-end gap-3">
            {filters.tab === "genre" ? (
              <Suspense key={`genres:${filters.type}`} fallback={<FilterSkeleton />}>
                <GenrePicker type={filters.type} current={filters.genre} />
              </Suspense>
            ) : null}

            {showStreamingFilters ? (
              <>
                <RegionFilter current={filters.region} />
                <Suspense
                  key={`providers:${filters.type}:${filters.region}`}
                  fallback={<FilterSkeleton />}
                >
                  <ProviderPicker
                    type={filters.type as Exclude<DiscoverType, "anime">}
                    region={filters.region}
                    current={filters.provider}
                  />
                </Suspense>
              </>
            ) : null}
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
      <DiscoverGrid list={list} />
      <PaginationControls page={page} hasMore={hasMore} />
    </>
  );
}

async function GenrePicker({ type, current }: { type: DiscoverType; current: number | undefined }) {
  const genres = await getGenresFor(type);
  return <GenreFilter genres={genres} current={current} />;
}

async function ProviderPicker({
  type,
  region,
  current,
}: {
  type: Exclude<DiscoverType, "anime">;
  region: DiscoverRegion;
  current: number | undefined;
}) {
  const providers = await getProvidersFor(type, region);
  return <ProviderFilter providers={providers} current={current} />;
}

async function ForYouSection() {
  const t = await getTranslations("discover.forYou");
  const result = await getForYou();
  const isEmpty = result.movies.length === 0 && result.tv.length === 0 && result.anime.length === 0;

  // Enrich TMDB items with OMDb ratings in a single parallel pass.
  const ratings = await fetchRatingsForTmdbItems([...result.movies, ...result.tv]);

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {result.fallback ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          {t("fallbackNotice")}
        </div>
      ) : null}

      {result.movies.length > 0 ? (
        <Section heading={t("sectionMovies")}>
          <ul className="flex flex-col gap-3">
            {result.movies.map((item) => (
              <li key={`movie-${item.id}`}>
                <MediaCard item={item} ratings={ratings.get(item.id) ?? null} />
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
                <MediaCard item={item} ratings={ratings.get(item.id) ?? null} />
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
                <AnimeCard item={item} />
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
