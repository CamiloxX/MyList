import { getTranslations } from "next-intl/server";
import { getForYou } from "@/features/discover/recommend";
import type { MediaKind } from "@/features/library/status";
import { CarouselRow } from "@/features/library-v2/components/carousel-row";
import { GenreChips } from "@/features/library-v2/components/genre-chips";
import { PosterCard } from "@/features/library-v2/components/poster-card";
import { Topbar } from "@/features/library-v2/components/topbar";
import {
  animeToPoster,
  browseGenre,
  getGenreChips,
  movieToPoster,
  parseGenre,
  tvToPoster,
} from "@/features/library-v2/data";
import type { PosterItem } from "@/features/library-v2/types";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

type PageProps = {
  searchParams: Promise<{ q?: string; genre?: string }>;
};

/** Round-robin merge so the recommendations row mixes movies, tv and anime. */
function interleave(lists: PosterItem[][], limit: number): PosterItem[] {
  const out: PosterItem[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max && out.length < limit; i++) {
    for (const list of lists) {
      const item = list[i];
      if (item && out.length < limit) out.push(item);
    }
  }
  return out;
}

function libraryItemToPoster(item: MediaItem): PosterItem {
  return {
    key: item.id,
    title: item.title,
    posterUrl: item.poster_url,
    kind: item.kind as MediaKind,
    meta: item.year ? String(item.year) : undefined,
    href: `/library/${item.id}`,
  };
}

export default async function LibraryV2Page({ searchParams }: PageProps) {
  const { q: rawQuery, genre: rawGenre } = await searchParams;
  const queryText = rawQuery?.trim() ?? "";
  const selection = parseGenre(rawGenre);

  const t = await getTranslations("libraryV2");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "";

  // Library grid (respects the search box) and a lean genre-mining projection
  // over the whole library run alongside the recommendation engine.
  let itemsQuery = supabase
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (queryText) {
    const escaped = queryText.replace(/[\\%_]/g, (m) => `\\${m}`);
    itemsQuery = itemsQuery.or(`title.ilike.%${escaped}%,original_title.ilike.%${escaped}%`);
  }

  const genreRowsQuery = user
    ? supabase.from("media_items").select("kind, genres").eq("user_id", user.id)
    : Promise.resolve({ data: [] as Array<{ kind: string; genres: unknown }>, error: null });

  const [forYou, { data: items }, { data: genreRows }] = await Promise.all([
    getForYou(),
    itemsQuery,
    genreRowsQuery,
  ]);

  const recommendations = interleave(
    [forYou.movies.map(movieToPoster), forYou.tv.map(tvToPoster), forYou.anime.map(animeToPoster)],
    16,
  );

  const chips = await getGenreChips(genreRows ?? []);
  const activeGenreLabel = selection
    ? (chips.find((c) => c.value === rawGenre)?.label ?? null)
    : null;
  const browseItems = selection ? await browseGenre(selection) : [];

  const libraryItems = (items ?? []).map(libraryItemToPoster);
  const baseParams: Record<string, string> = queryText ? { q: queryText } : {};

  return (
    <>
      <Topbar userName={displayName} defaultQuery={queryText} />

      <main className="flex flex-1 flex-col gap-10 px-4 py-6 lg:px-6">
        <CarouselRow
          title={t("recommendations")}
          items={recommendations}
          seeAllHref="/discover"
          seeAllLabel={t("seeAll")}
          emptyLabel={t("genreEmpty")}
        />

        <section id="genres" className="flex scroll-mt-4 flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("genres")}</h2>
          <GenreChips chips={chips} active={rawGenre ?? null} baseParams={baseParams} />

          {selection ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("browsing", { genre: activeGenreLabel ?? "" })}
              </h3>
              <PosterGrid items={browseItems} />
            </div>
          ) : null}
        </section>

        {!selection ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">{t("myLibrary")}</h2>
            <PosterGrid items={libraryItems} />
          </section>
        ) : null}
      </main>
    </>
  );
}

function PosterGrid({ items }: { items: PosterItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
      {items.map((item) => (
        <PosterCard key={item.key} item={item} />
      ))}
    </div>
  );
}
