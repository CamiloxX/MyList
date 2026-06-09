import { getTranslations } from "next-intl/server";
import type { MediaKind } from "@/features/library/status";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { browseGenre, getGenreChips, parseGenre } from "../data";
import { getSourceScore } from "../detail-data";
import type { PosterItem } from "../types";
import { GenreChips } from "./genre-chips";
import { PosterCard } from "./poster-card";
import { Topbar } from "./topbar";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

function libraryItemToPoster(item: MediaItem): PosterItem {
  return {
    key: item.id,
    title: item.title,
    posterUrl: item.poster_url,
    kind: item.kind as MediaKind,
    meta: item.year ? String(item.year) : undefined,
    href: `/library/${item.id}`,
    score: getSourceScore(item) ?? undefined,
  };
}

/**
 * The desktop library: the user's own titles as poster cards, plus a genre
 * explorer. Recommendations live in Discover ("Para ti"), not here — the
 * library is about what you already track.
 */
export async function DesktopLibrary({
  searchParams,
}: {
  searchParams: { q?: string; genre?: string };
}) {
  const queryText = searchParams.q?.trim() ?? "";
  const rawGenre = searchParams.genre;
  const selection = parseGenre(rawGenre);

  const t = await getTranslations("libraryV2");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "";

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

  const [{ data: items }, { data: genreRows }] = await Promise.all([itemsQuery, genreRowsQuery]);

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
        {selection ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">{t("genres")}</h2>
            <GenreChips chips={chips} active={rawGenre ?? null} baseParams={baseParams} />
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("browsing", { genre: activeGenreLabel ?? "" })}
            </h3>
            <PosterGrid items={browseItems} />
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{t("myLibrary")}</h2>
              <PosterGrid items={libraryItems} />
            </section>

            <section id="genres" className="flex scroll-mt-4 flex-col gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{t("genres")}</h2>
              <GenreChips chips={chips} active={null} baseParams={baseParams} />
            </section>
          </>
        )}
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
