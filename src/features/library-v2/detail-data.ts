import "server-only";

import { getMediaWatchUrl } from "@/features/library/actions";
import { getListsForItem } from "@/features/lists/queries";
import type { AiringStatus } from "@/lib/airing-status";
import { getAnilistNextEpisode } from "@/lib/anilist/next-episode";
import { getJikanAiringStatus } from "@/lib/jikan/airing";
import { getJikanTrailer } from "@/lib/jikan/videos";
import type { OmdbRatings } from "@/lib/omdb/schemas";
import { createClient } from "@/lib/supabase/server";
import type { WatchProvidersForTitle } from "@/lib/tmdb/discover";
import { getTmdbTvAiringStatus, getTmdbTvNextEpisode } from "@/lib/tmdb/tv";
import { getTmdbTrailer } from "@/lib/tmdb/videos";
import type { Database } from "@/types/database";
import { fetchTitleRatings } from "./ratings";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];
type WatchEntry = {
  id: string;
  watched_on: string;
  rating: number | null;
  platform: string | null;
  notes: string | null;
  season_number: number | null;
};

export type DetailProviders =
  | { type: "tmdb"; data: WatchProvidersForTitle }
  | { type: "anime"; items: { name: string; url: string }[] }
  | null;

export type NextEpisodeInfo = {
  seasonNumber: number | null;
  episodeNumber: number | null;
  airDateIso: string | null;
  hasExactTime: boolean;
};

export type SeriesDetailData = {
  item: MediaItem;
  entries: WatchEntry[];
  watchUrl: string | null;
  trailer: { youtubeKey: string } | null;
  providers: DetailProviders;
  airing: AiringStatus;
  nextEpisode: NextEpisodeInfo | null;
  lists: Awaited<ReturnType<typeof getListsForItem>>;
  ratings: OmdbRatings | null;
};

/**
 * Loads everything the desktop detail view needs for one library item, mirroring
 * the data the existing /library/[id] page already shows (watch URL, trailer,
 * providers, airing state, next episode, list memberships) — re-composed here so
 * the prototype stays isolated and doesn't touch the existing page. Returns null
 * when the item doesn't exist.
 */
export async function loadSeriesDetail(id: string): Promise<SeriesDetailData | null> {
  const supabase = await createClient();
  const { data: item } = await supabase.from("media_items").select("*").eq("id", id).maybeSingle();
  if (!item) return null;

  const [watchUrl, { data: entries }, trailer, providers, airing, nextEpisode, lists, ratings] =
    await Promise.all([
      getMediaWatchUrl(id).catch(() => null),
      supabase
        .from("watch_entries")
        .select("id, watched_on, rating, platform, notes, season_number")
        .eq("media_item_id", id)
        .order("watched_on", { ascending: false }),
      fetchTrailerFor(item.source, item.kind, item.source_id),
      fetchWatchProviders(item.source, item.kind, item.source_id),
      fetchAiringStatus(item.source, item.kind, item.source_id),
      fetchNextEpisode(item.source, item.kind, item.source_id),
      getListsForItem(item.id),
      fetchTitleRatings(item.source, item.kind, item.source_id),
    ]);

  return {
    item,
    entries: entries ?? [],
    watchUrl,
    trailer,
    providers,
    airing,
    nextEpisode,
    lists,
    ratings,
  };
}

/** Wide 16:9 key-art for the hero. TMDB titles store a `backdrop_path` in
 *  raw_metadata at add-time; anime (Jikan) has none, so this returns null and
 *  the hero falls back to the blurred poster. No extra network call. */
export function getBackdropUrl(item: MediaItem): string | null {
  const raw = item.raw_metadata as Record<string, unknown> | null;
  const path = raw && typeof raw.backdrop_path === "string" ? raw.backdrop_path : null;
  return path ? `https://image.tmdb.org/t/p/w1280${path}` : null;
}

/** Synopsis text stored in raw_metadata at add-time (TMDB `overview` / Jikan
 *  `synopsis`). No extra network call. */
export function getSynopsis(item: MediaItem): string | null {
  const raw = item.raw_metadata as Record<string, unknown> | null;
  if (!raw) return null;
  const value = typeof raw.overview === "string" ? raw.overview : raw.synopsis;
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

/** Source rating stored in raw_metadata (TMDB `vote_average` 0-10 / Jikan
 *  `score` 0-10). Returns a one-decimal string or null. */
export function getSourceScore(item: MediaItem): string | null {
  const raw = item.raw_metadata as Record<string, unknown> | null;
  if (!raw) return null;
  const value = typeof raw.vote_average === "number" ? raw.vote_average : raw.score;
  return typeof value === "number" && value > 0 ? value.toFixed(1) : null;
}

/** Resolves the stored genre ids/names into display labels. Anime genres are
 *  already names; TMDB genres are numeric ids resolved via the cached catalog. */
export async function resolveGenreNames(item: MediaItem): Promise<string[]> {
  const genres = Array.isArray(item.genres) ? item.genres : [];
  if (genres.length === 0) return [];
  if (item.kind === "anime") {
    return genres.filter((g): g is string => typeof g === "string").slice(0, 4);
  }
  const ids = genres.filter((g): g is number => typeof g === "number");
  if (ids.length === 0) return [];
  const { getMovieGenres, getTvGenres } = await import("@/lib/tmdb/discover");
  const catalog = await (item.kind === "movie" ? getMovieGenres() : getTvGenres()).catch(() => []);
  const names = new Map(catalog.map((g) => [g.id, g.name]));
  return ids
    .map((id) => names.get(id))
    .filter((n): n is string => typeof n === "string")
    .slice(0, 4);
}

async function fetchTrailerFor(
  source: string,
  kind: string,
  sourceId: string,
): Promise<{ youtubeKey: string } | null> {
  if (source === "tmdb" && (kind === "movie" || kind === "tv")) {
    return getTmdbTrailer(kind, sourceId);
  }
  if (source === "anilist" && kind === "anime") {
    return getJikanTrailer(sourceId);
  }
  return null;
}

async function fetchWatchProviders(
  source: string,
  kind: string,
  sourceId: string,
): Promise<DetailProviders> {
  if (source === "tmdb" && (kind === "movie" || kind === "tv")) {
    const { getWatchProvidersForTitle } = await import("@/lib/tmdb/discover");
    const data = await getWatchProvidersForTitle(Number.parseInt(sourceId, 10), kind, "CO").catch(
      () => null,
    );
    return data ? { type: "tmdb", data } : null;
  }
  if (source === "anilist" && kind === "anime") {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${sourceId}/streaming`);
      if (res.ok) {
        const json = (await res.json()) as { data?: { name?: string; url?: string }[] };
        const items = (json.data ?? [])
          .map((p) => ({ name: p.name ?? "", url: p.url ?? "" }))
          .filter((p) => p.name !== "" && p.url !== "");
        if (items.length > 0) return { type: "anime", items };
      }
    } catch (e) {
      console.warn("[library-v2] Failed to fetch Jikan streaming info:", e);
    }
  }
  return null;
}

async function fetchAiringStatus(
  source: string,
  kind: string,
  sourceId: string,
): Promise<AiringStatus> {
  if (source === "tmdb" && kind === "tv") return getTmdbTvAiringStatus(sourceId);
  if (source === "anilist" && kind === "anime") return getJikanAiringStatus(sourceId);
  return "unknown";
}

async function fetchNextEpisode(
  source: string,
  kind: string,
  sourceId: string,
): Promise<NextEpisodeInfo | null> {
  if (source === "tmdb" && kind === "tv") {
    const ep = await getTmdbTvNextEpisode(sourceId);
    if (!ep?.airDate) return null;
    return {
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      airDateIso: `${ep.airDate}T12:00:00Z`,
      hasExactTime: false,
    };
  }
  if (source === "anilist" && kind === "anime") {
    const ep = await getAnilistNextEpisode(sourceId);
    if (!ep) return null;
    return {
      seasonNumber: null,
      episodeNumber: ep.episode,
      airDateIso: new Date(ep.airingAt * 1000).toISOString(),
      hasExactTime: true,
    };
  }
  return null;
}
