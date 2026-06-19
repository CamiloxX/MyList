import "server-only";

import type { MediaKind } from "@/features/library/status";
import type { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { loadBadgeCatalog } from "./catalog";
import { pushNewBadges } from "./push-notify";
import type {
  BadgeCriterion,
  BadgeDefinition,
  BadgeProgress,
  BadgeStats,
  BadgeWithStatus,
} from "./types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const ONE_DAY_MS = 86_400_000;
const EMPTY_STATS: BadgeStats = {
  totalEntries: 0,
  ratedEntries: 0,
  completedByKind: { movie: 0, tv: 0, anime: 0 },
  uniqueGenres: 0,
  uniqueDecades: 0,
  maxSameDayEntries: 0,
  longestDailyStreak: 0,
  watchedTitleSeasons: new Set(),
  watchedTitles: new Set(),
  episodesByTitle: new Map(),
};

/** Stable key for a watched (title, season) pair — see title_season criterion. */
function titleSeasonKey(source: string, sourceId: string, season: number): string {
  return `${source}:${sourceId}:${season}`;
}

/** Stable key for a watched title — see title_completed criterion. */
function titleKey(source: string, sourceId: string): string {
  return `${source}:${sourceId}`;
}

async function loadStats(supabase: ServerClient, userId: string): Promise<BadgeStats> {
  const [entriesRes, completedRes, seasonsRes, episodesRes] = await Promise.all([
    supabase.from("watch_entries").select("watched_on, rating").eq("user_id", userId),
    supabase
      .from("media_items")
      .select("kind, genres, year, source, source_id")
      .eq("user_id", userId)
      .eq("status", "watched"),
    supabase
      .from("watch_entries")
      .select("season_number, media_items!inner(source, source_id)")
      .eq("user_id", userId)
      .not("season_number", "is", null),
    supabase
      .from("media_items")
      .select("source, source_id, episodes_watched")
      .eq("user_id", userId)
      .eq("kind", "anime"),
  ]);

  if (entriesRes.error || completedRes.error) {
    return EMPTY_STATS;
  }

  const entries = entriesRes.data ?? [];
  const completed = completedRes.data ?? [];

  const totalEntries = entries.length;
  let ratedEntries = 0;
  const dayCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.rating != null) ratedEntries += 1;
    dayCounts.set(e.watched_on, (dayCounts.get(e.watched_on) ?? 0) + 1);
  }

  let maxSameDayEntries = 0;
  for (const c of dayCounts.values()) {
    if (c > maxSameDayEntries) maxSameDayEntries = c;
  }

  // Longest run of consecutive distinct days. Date.parse on YYYY-MM-DD is UTC,
  // so subtraction in ms is exact (no DST drift).
  const distinctDays = Array.from(dayCounts.keys()).sort();
  let longestDailyStreak = 0;
  let currentStreak = 0;
  let prevTs: number | null = null;
  for (const day of distinctDays) {
    const ts = Date.parse(day);
    if (Number.isNaN(ts)) continue;
    currentStreak = prevTs != null && ts - prevTs === ONE_DAY_MS ? currentStreak + 1 : 1;
    if (currentStreak > longestDailyStreak) longestDailyStreak = currentStreak;
    prevTs = ts;
  }

  const completedByKind: Record<MediaKind, number> = { movie: 0, tv: 0, anime: 0 };
  const genreSet = new Set<string>();
  const decadeSet = new Set<number>();
  const watchedTitles = new Set<string>();
  for (const m of completed) {
    completedByKind[m.kind] = (completedByKind[m.kind] ?? 0) + 1;
    if (Array.isArray(m.genres)) {
      for (const g of m.genres) {
        if (g != null) genreSet.add(String(g));
      }
    }
    if (m.year != null) {
      decadeSet.add(Math.floor(m.year / 10) * 10);
    }
    if (m.source && m.source_id != null) {
      watchedTitles.add(titleKey(m.source, m.source_id));
    }
  }

  // (title, season) pairs the user has marked watched, for title_season badges.
  const watchedTitleSeasons = new Set<string>();
  for (const row of seasonsRes.data ?? []) {
    if (row.season_number == null) continue;
    // PostgREST returns the to-one embed as an object, but type inference can
    // widen it to an array — normalize both shapes.
    const media = Array.isArray(row.media_items) ? row.media_items[0] : row.media_items;
    if (media?.source && media?.source_id != null) {
      watchedTitleSeasons.add(titleSeasonKey(media.source, media.source_id, row.season_number));
    }
  }

  // Episodes watched per anime title, for title_episodes badges.
  const episodesByTitle = new Map<string, number>();
  for (const row of episodesRes.data ?? []) {
    if (row.source && row.source_id != null) {
      episodesByTitle.set(titleKey(row.source, row.source_id), row.episodes_watched ?? 0);
    }
  }

  return {
    totalEntries,
    ratedEntries,
    completedByKind,
    uniqueGenres: genreSet.size,
    uniqueDecades: decadeSet.size,
    maxSameDayEntries,
    longestDailyStreak,
    watchedTitleSeasons,
    watchedTitles,
    episodesByTitle,
  };
}

function progressFor(criterion: BadgeCriterion, stats: BadgeStats): BadgeProgress {
  switch (criterion.kind) {
    case "watch_entries_count":
      return { current: Math.min(stats.totalEntries, criterion.target), target: criterion.target };
    case "ratings_count":
      return { current: Math.min(stats.ratedEntries, criterion.target), target: criterion.target };
    case "media_completed_count":
      return {
        current: Math.min(stats.completedByKind[criterion.mediaKind], criterion.target),
        target: criterion.target,
      };
    case "unique_genres_count":
      return { current: Math.min(stats.uniqueGenres, criterion.target), target: criterion.target };
    case "unique_decades_count":
      return { current: Math.min(stats.uniqueDecades, criterion.target), target: criterion.target };
    case "same_day_entries":
      return {
        current: Math.min(stats.maxSameDayEntries, criterion.target),
        target: criterion.target,
      };
    case "daily_streak":
      return {
        current: Math.min(stats.longestDailyStreak, criterion.target),
        target: criterion.target,
      };
    case "title_season": {
      const key = titleSeasonKey(criterion.source, criterion.sourceId, criterion.season);
      return { current: stats.watchedTitleSeasons.has(key) ? 1 : 0, target: 1 };
    }
    case "title_completed": {
      const key = titleKey(criterion.source, criterion.sourceId);
      return { current: stats.watchedTitles.has(key) ? 1 : 0, target: 1 };
    }
    case "title_episodes": {
      const key = titleKey(criterion.source, criterion.sourceId);
      const current = stats.episodesByTitle.get(key) ?? 0;
      return { current: Math.min(current, criterion.episodes), target: criterion.episodes };
    }
    case "manual":
      // Never auto-granted; only an admin awards it. Shown as 0/1 until earned.
      return { current: 0, target: 1 };
  }
}

/**
 * Re-evaluates every badge for the given user and persists the newly earned
 * ones into `user_badges`. Returns only the badges that were *just* unlocked
 * (so the caller can surface them via toast). Designed to be safe to call
 * after every user-facing write — soft-fails on any DB error.
 */
export async function evaluateAndPersist(
  supabase: ServerClient,
  userId: string,
): Promise<BadgeDefinition[]> {
  const [catalog, earnedRes] = await Promise.all([
    loadBadgeCatalog(supabase),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
  ]);
  if (earnedRes.error) return [];

  const alreadyEarned = new Set(earnedRes.data?.map((r) => r.badge_id) ?? []);
  const pending = catalog.filter((b) => !alreadyEarned.has(b.id));
  if (pending.length === 0) return [];

  const stats = await loadStats(supabase, userId);

  const newlyEarned: BadgeDefinition[] = [];
  for (const badge of pending) {
    const { current, target } = progressFor(badge.criterion, stats);
    if (current >= target) newlyEarned.push(badge);
  }
  if (newlyEarned.length === 0) return [];

  // Persist via the service-role client: the self-insert RLS policy on
  // user_badges is removed (a browser client could otherwise self-grant
  // arbitrary badges). The criterion was already validated above, so this
  // privileged write only records legitimately-earned badges.
  const admin = createServiceRoleClient();
  const insertRes = await admin
    .from("user_badges")
    .insert(newlyEarned.map((b) => ({ user_id: userId, badge_id: b.id })))
    .select("badge_id");
  if (insertRes.error) return [];

  const inserted = new Set(insertRes.data?.map((r) => r.badge_id) ?? []);
  const justEarned = newlyEarned.filter((b) => inserted.has(b.id));

  // Best-effort: fire push *after* the DB write so a failed delivery never
  // blocks the badge from being recorded. The in-app toast is still emitted
  // by the celebration provider on the client.
  await pushNewBadges(userId, justEarned);

  return justEarned;
}

/**
 * Loads every badge in the catalog with the user's current progress and
 * earned_at (when applicable). Side-effect: re-evaluates first so visiting
 * /badges grants any unlock that may have been missed by a prior failure.
 */
export async function getAllBadgesWithStatus(
  supabase: ServerClient,
  userId: string,
): Promise<BadgeWithStatus[]> {
  await evaluateAndPersist(supabase, userId);

  const [catalog, earnedRes, stats] = await Promise.all([
    loadBadgeCatalog(supabase),
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
    loadStats(supabase, userId),
  ]);

  const earnedMap = new Map<string, string>();
  for (const row of earnedRes.data ?? []) {
    earnedMap.set(row.badge_id, row.earned_at);
  }

  return catalog.map((badge) => ({
    ...badge,
    progress: progressFor(badge.criterion, stats),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }));
}

/** True when a title-based criterion points at this exact (source, sourceId, kind). */
function criterionTargetsTitle(
  criterion: BadgeCriterion,
  source: string,
  sourceId: string,
  kind: string,
): boolean {
  switch (criterion.kind) {
    case "title_completed":
    case "title_season":
      return (
        criterion.source === source &&
        criterion.sourceId === sourceId &&
        criterion.mediaKind === kind
      );
    case "title_episodes":
      return criterion.source === source && criterion.sourceId === sourceId;
    default:
      return false;
  }
}

/**
 * Lightweight counterpart to getAllBadgesWithStatus for the library detail page:
 * resolves only the badges whose criterion targets THIS title, computing their
 * progress from the item itself (no global stats pass) and persisting any the
 * item already satisfies. One query (the cached catalog) for titles with no
 * linked badge; a couple of scoped ones otherwise — vs. the full catalog
 * re-evaluation + double library scan getAllBadgesWithStatus does.
 */
export async function getTitleBadgesWithStatus(
  supabase: ServerClient,
  userId: string,
  item: {
    id: string;
    source: string;
    sourceId: string;
    kind: string;
    status: string;
    episodesWatched: number;
  },
): Promise<BadgeWithStatus[]> {
  const catalog = await loadBadgeCatalog(supabase);
  const matching = catalog.filter((b) =>
    criterionTargetsTitle(b.criterion, item.source, item.sourceId, item.kind),
  );
  if (matching.length === 0) return [];

  const earnedRes = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .in(
      "badge_id",
      matching.map((b) => b.id),
    );

  // Seasons of THIS item the user has watched — only needed for title_season.
  const watchedSeasons = new Set<number>();
  if (matching.some((b) => b.criterion.kind === "title_season")) {
    const seasonsRes = await supabase
      .from("watch_entries")
      .select("season_number")
      .eq("media_item_id", item.id)
      .not("season_number", "is", null);
    for (const row of seasonsRes.data ?? []) {
      if (row.season_number != null) watchedSeasons.add(row.season_number);
    }
  }

  // A stats snapshot scoped to this single title — enough for title_* criteria,
  // which only ever look up this title's keys.
  const key = titleKey(item.source, item.sourceId);
  const stats: BadgeStats = {
    ...EMPTY_STATS,
    watchedTitles: item.status === "watched" ? new Set([key]) : new Set(),
    watchedTitleSeasons: new Set(
      [...watchedSeasons].map((s) => titleSeasonKey(item.source, item.sourceId, s)),
    ),
    episodesByTitle: new Map([[key, item.episodesWatched]]),
  };

  const earnedMap = new Map<string, string>();
  for (const row of earnedRes.data ?? []) earnedMap.set(row.badge_id, row.earned_at);

  // Grant any matching badge the title already satisfies but isn't recorded yet
  // (e.g. a freshly-created badge). Scoped to these few badges, no catalog pass.
  // Mirrors evaluateAndPersist's privileged write + best-effort push.
  const newlyEarned = matching.filter((b) => {
    if (earnedMap.has(b.id)) return false;
    const p = progressFor(b.criterion, stats);
    return p.current >= p.target;
  });
  if (newlyEarned.length > 0) {
    const admin = createServiceRoleClient();
    const insertRes = await admin
      .from("user_badges")
      .insert(newlyEarned.map((b) => ({ user_id: userId, badge_id: b.id })))
      .select("badge_id, earned_at");
    if (!insertRes.error) {
      const insertedIds = new Set<string>();
      for (const row of insertRes.data ?? []) {
        earnedMap.set(row.badge_id, row.earned_at);
        insertedIds.add(row.badge_id);
      }
      await pushNewBadges(
        userId,
        newlyEarned.filter((b) => insertedIds.has(b.id)),
      );
    }
  }

  return matching.map((badge) => ({
    ...badge,
    progress: progressFor(badge.criterion, stats),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }));
}
