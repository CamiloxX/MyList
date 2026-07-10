import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimeResults } from "@/features/search/components/anime-results";
import { SearchInput } from "@/features/search/components/search-input";
import { SearchResults } from "@/features/search/components/search-results";
import { SearchTabs, type SearchType } from "@/features/search/components/search-tabs";
import { loadingDemoDelay } from "@/lib/loading-demo";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await loadingDemoDelay();
  const { q, type } = await searchParams;
  const trimmed = q?.trim() ?? "";
  const searchType: SearchType = type === "anime" ? "anime" : "tmdb";
  const t = await getTranslations("search");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchType === "anime" ? t("subtitleAnime") : t("subtitleTmdb")}
        </p>
      </header>

      <SearchTabs current={searchType} />
      <SearchInput defaultValue={trimmed} />

      {trimmed ? (
        <Suspense key={`${searchType}:${trimmed}`} fallback={<ResultsSkeleton />}>
          {searchType === "anime" ? (
            <AnimeResults query={trimmed} />
          ) : (
            <SearchResults query={trimmed} />
          )}
        </Suspense>
      ) : (
        <SearchPrompt />
      )}
    </div>
  );
}

async function SearchPrompt() {
  const t = await getTranslations("search");
  return <EmptyState title={t("emptyPrompt")} />;
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
