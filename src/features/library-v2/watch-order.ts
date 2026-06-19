import "server-only";

import { libraryItemKey } from "@/features/library/queries";
import { getJikanAnimeById } from "@/lib/jikan/anime";
import { type FranchiseNode, traverseAnimeFranchise } from "@/lib/jikan/relations";
import { jikanPoster, jikanTitle } from "@/lib/jikan/search";
import { createClient } from "@/lib/supabase/server";
import { getMovieCollectionId, getTmdbCollection, getTmdbMovieBrief } from "@/lib/tmdb/collection";
import { tmdbImage } from "@/lib/tmdb/images";
import { findCuratedFranchise } from "./curated-franchises";

export type WatchOrderEntry = {
  source: "tmdb" | "anilist";
  kind: "movie" | "tv" | "anime";
  sourceId: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  isCurrent: boolean;
  /** Raw MAL relation to its parent (anime only), localized by the component. */
  relationLabel?: string | null;
};

export type WatchOrderKind = "story" | "release" | "chronological";

export type WatchOrderResult = {
  franchiseName: string;
  /** At least one order; the component shows a toggle when there's more than one. */
  orders: Partial<Record<WatchOrderKind, WatchOrderEntry[]>>;
};

function yearFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const y = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds the franchise watch order(s) for a title, or null when it isn't part of
 * a franchise we can resolve. Movies use TMDB collections (release) plus a curated
 * chronological order when known; anime walks the Jikan relations graph.
 */
export async function getWatchOrder(
  source: string,
  kind: string,
  sourceId: string,
): Promise<WatchOrderResult | null> {
  if (source === "anilist" && kind === "anime") return getAnimeWatchOrder(sourceId);
  if (source === "tmdb" && kind === "movie") return getMovieWatchOrder(sourceId);
  return null;
}

// --- Movies --------------------------------------------------------------

async function getMovieWatchOrder(movieId: string): Promise<WatchOrderResult | null> {
  const curated = findCuratedFranchise("tmdb", "movie", movieId);
  if (curated) {
    const briefs = await Promise.all(
      curated.chronological.map((e) => getTmdbMovieBrief(e.sourceId)),
    );
    const chronological: WatchOrderEntry[] = curated.chronological.map((e, i) => {
      const b = briefs[i];
      return {
        source: "tmdb",
        kind: "movie",
        sourceId: e.sourceId,
        title: b?.title ?? `#${e.sourceId}`,
        posterUrl: tmdbImage(b?.posterPath, "w185"),
        year: yearFromDate(b?.releaseDate),
        isCurrent: e.sourceId === movieId,
      };
    });
    if (chronological.length < 2) return null;
    const release = [...chronological].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    return { franchiseName: curated.name, orders: { chronological, release } };
  }

  const ref = await getMovieCollectionId(movieId);
  if (!ref) return null;
  const collection = await getTmdbCollection(ref.id);
  if (!collection || collection.parts.length < 2) return null;

  const release: WatchOrderEntry[] = collection.parts
    .map((p) => ({
      source: "tmdb" as const,
      kind: "movie" as const,
      sourceId: String(p.id),
      title: p.title,
      posterUrl: tmdbImage(p.poster_path, "w185"),
      year: yearFromDate(p.release_date),
      isCurrent: String(p.id) === movieId,
    }))
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));

  return { franchiseName: collection.name, orders: { release } };
}

// --- Anime ---------------------------------------------------------------

// ~1 call/s keeps us under Jikan's 60/min limit (the traversal already spent its
// budget on relations calls; details run right after, sequentially).
const ANIME_DETAIL_DELAY_MS = 1100;
// Recaps / alt-versions slot right after their parent rather than by their own year.
const ADJACENT_RELATIONS = new Set(["Summary", "Full story", "Alternative version"]);

async function getAnimeWatchOrder(originId: string): Promise<WatchOrderResult | null> {
  const origin = Number.parseInt(originId, 10);
  if (!Number.isFinite(origin)) return null;

  // Prefer a hand-curated order (verified MAL ids in the recommended sequence)
  // over the Jikan relations graph, which is noisy for movie/recap-heavy
  // franchises. The curated list is already in watch order — just resolve each
  // entry's details (sequentially, to respect Jikan's rate limit).
  const curated = findCuratedFranchise("anilist", "anime", originId);
  if (curated) {
    const entries: WatchOrderEntry[] = [];
    for (const e of curated.chronological) {
      const detail = await getJikanAnimeById(Number(e.sourceId));
      await sleep(ANIME_DETAIL_DELAY_MS);
      entries.push({
        source: "anilist",
        kind: "anime",
        sourceId: e.sourceId,
        title: detail ? jikanTitle(detail) : `MAL #${e.sourceId}`,
        posterUrl: detail ? jikanPoster(detail) : null,
        year: detail?.year ?? null,
        isCurrent: e.sourceId === originId,
      });
    }
    if (entries.length < 2) return null;
    return { franchiseName: curated.name, orders: { story: entries } };
  }

  const nodes = await traverseAnimeFranchise(origin);
  if (nodes.length < 2) return null;

  // Sequential detail fetches respect Jikan's rate limit (cached 24h after).
  const entries: WatchOrderEntry[] = [];
  for (const node of nodes) {
    const detail = await getJikanAnimeById(node.malId);
    await sleep(ANIME_DETAIL_DELAY_MS);
    entries.push({
      source: "anilist",
      kind: "anime",
      sourceId: String(node.malId),
      title: detail ? jikanTitle(detail) : `MAL #${node.malId}`,
      posterUrl: detail ? jikanPoster(detail) : null,
      year: detail?.year ?? null,
      isCurrent: node.malId === origin,
      relationLabel: node.relationToParent,
    });
  }

  const story = orderAnimeFranchise(nodes, entries);
  const franchiseName = story[0]?.title ?? entries[0]?.title ?? "";
  return { franchiseName, orders: { story } };
}

function orderAnimeFranchise(
  nodes: FranchiseNode[],
  entries: WatchOrderEntry[],
): WatchOrderEntry[] {
  const nodeByMal = new Map(nodes.map((n) => [n.malId, n]));
  const yearByMal = new Map(entries.map((e) => [Number(e.sourceId), e.year]));

  const sortKey = (mal: number): [number, number] => {
    const node = nodeByMal.get(mal);
    const ownYear = yearByMal.get(mal) ?? 9999;
    if (
      node?.parentMalId != null &&
      node.relationToParent &&
      ADJACENT_RELATIONS.has(node.relationToParent)
    ) {
      return [yearByMal.get(node.parentMalId) ?? ownYear, 1];
    }
    return [ownYear, 0];
  };

  return [...entries].sort((a, b) => {
    const ka = sortKey(Number(a.sourceId));
    const kb = sortKey(Number(b.sourceId));
    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    if (ka[1] !== kb[1]) return ka[1] - kb[1];
    return Number(a.sourceId) - Number(b.sourceId);
  });
}

// --- Owned-entry → /library/[uuid] map -----------------------------------

/**
 * Maps the franchise entries the user already owns to their media_items id, so
 * owned rows link straight to the detail view. One round-trip: every entry in a
 * franchise shares a (source, kind). Keyed by `libraryItemKey`.
 */
export async function getOwnedMediaItemIds(
  entries: WatchOrderEntry[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (entries.length === 0) return out;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return out;

  const first = entries[0];
  if (!first) return out;
  const { data } = await supabase
    .from("media_items")
    .select("id, source, source_id, kind")
    .eq("user_id", user.id)
    .eq("source", first.source)
    .eq("kind", first.kind)
    .in(
      "source_id",
      entries.map((e) => e.sourceId),
    );

  for (const row of data ?? []) {
    out.set(
      libraryItemKey({ source: row.source, sourceId: row.source_id, kind: row.kind }),
      row.id,
    );
  }
  return out;
}
