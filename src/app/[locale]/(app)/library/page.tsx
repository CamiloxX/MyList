import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { LibraryCard } from "@/features/library/components/library-card";
import {
  type LibraryFilterCounts,
  LibraryFilters,
} from "@/features/library/components/library-filters";
import { LibrarySearchInput } from "@/features/library/components/library-search-input";
import { LibrarySortSelect } from "@/features/library/components/library-sort-select";
import { RandomPickButton } from "@/features/library/components/random-pick-button";
import { parseLibrarySort } from "@/features/library/sort";
import type { MediaKind, MediaStatus } from "@/features/library/status";
import { DesktopLibrary } from "@/features/library-v2/components/desktop-library";
import { Link } from "@/i18n/navigation";
import { isMobileUserAgent } from "@/lib/device";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ReadonlyArray<MediaStatus> = ["watching", "watched", "pending", "dropped"];
const VALID_KINDS: ReadonlyArray<MediaKind> = ["movie", "tv", "anime"];

type LibraryPageProps = {
  searchParams: Promise<{
    status?: string;
    kind?: string;
    q?: string;
    sort?: string;
    genre?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;

  // Desktop devices get the new v2 library; mobile keeps the list below.
  // DesktopLibrary ships its own full-width Topbar + padding, so break it out of
  // the app shell's content gutter (px-6 py-6 in (app)/layout.tsx) with -m-6.
  if (!isMobileUserAgent((await headers()).get("user-agent"))) {
    return (
      <div className="-m-6">
        <DesktopLibrary searchParams={{ q: params.q, genre: params.genre }} />
      </div>
    );
  }

  await loadingDemoDelay();
  const { status: rawStatus, kind: rawKind, q: rawQuery, sort: rawSort } = params;
  const status = VALID_STATUSES.includes(rawStatus as MediaStatus)
    ? (rawStatus as MediaStatus)
    : null;
  const kind = VALID_KINDS.includes(rawKind as MediaKind) ? (rawKind as MediaKind) : null;
  const queryText = rawQuery?.trim() ?? "";
  const sort = parseLibrarySort(rawSort);

  const t = await getTranslations("library");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("media_items").select("*");

  switch (sort) {
    case "title-asc":
      query = query.order("title", { ascending: true });
      break;
    case "title-desc":
      query = query.order("title", { ascending: false });
      break;
    case "year-desc":
      query = query
        .order("year", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "year-asc":
      query = query
        .order("year", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
  if (queryText) {
    // Escape PostgREST `ilike` wildcards in user input so a literal % or _
    // doesn't broaden the match unexpectedly.
    const escaped = queryText.replace(/[\\%_]/g, (m) => `\\${m}`);
    query = query.or(`title.ilike.%${escaped}%,original_title.ilike.%${escaped}%`);
  }

  // Fetch the filter-counts query in parallel: a tiny `(status, kind)` projection
  // over the user's full library so each filter pill shows its total regardless
  // of the OTHER active filter — gives a stable, predictable picture.
  const countsPromise = user
    ? supabase.from("media_items").select("status, kind").eq("user_id", user.id)
    : Promise.resolve({ data: [] as Array<{ status: MediaStatus; kind: MediaKind }>, error: null });

  const [{ data: items, error }, { data: countsRows }] = await Promise.all([query, countsPromise]);

  const counts = aggregateCounts(countsRows ?? []);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        </header>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("loadError", { message: error.message })}
        </div>
      </div>
    );
  }

  const itemsList = items ?? [];
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "";
  const namePart = displayName ? `, ${displayName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("hello", { name: namePart })}
            {itemsList.length === 0 ? t("empty") : t("count", { count: itemsList.length })}
          </p>
        </div>
        <RandomPickButton />
      </header>

      <div className="flex flex-col gap-3">
        <LibrarySearchInput defaultValue={queryText} />
        <div className="flex flex-wrap items-center gap-2">
          <LibraryFilters counts={counts} />
          <LibrarySortSelect current={sort} />
        </div>
      </div>

      {itemsList.length === 0 ? (
        <LibraryEmpty filtered={Boolean(status || kind || queryText)} />
      ) : (
        <ul className="flex flex-col gap-3">
          {itemsList.map((item) => (
            <li key={item.id}>
              <LibraryCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function aggregateCounts(
  rows: ReadonlyArray<{ status: MediaStatus; kind: MediaKind }>,
): LibraryFilterCounts {
  const byStatus: Record<MediaStatus, number> = {
    watching: 0,
    watched: 0,
    pending: 0,
    dropped: 0,
  };
  const byKind: Record<MediaKind, number> = { movie: 0, tv: 0, anime: 0 };
  for (const row of rows) {
    byStatus[row.status] += 1;
    byKind[row.kind] += 1;
  }
  return { total: rows.length, byStatus, byKind };
}

async function LibraryEmpty({ filtered }: { filtered: boolean }) {
  const t = await getTranslations("library");
  if (filtered) {
    return <EmptyState title={t("emptyFiltered")} />;
  }
  return (
    <EmptyState
      title={t("emptyTitle")}
      action={
        <Link href="/search" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          {t("emptyAction")}
        </Link>
      }
    />
  );
}
