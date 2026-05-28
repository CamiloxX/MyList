import "server-only";

import type { MediaKind } from "@/features/library/status";
import type { createClient } from "@/lib/supabase/server";
import { BADGE_CATALOG } from "./catalog";
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
};

async function loadStats(supabase: ServerClient, userId: string): Promise<BadgeStats> {
  const [entriesRes, completedRes] = await Promise.all([
    supabase.from("watch_entries").select("watched_on, rating").eq("user_id", userId),
    supabase
      .from("media_items")
      .select("kind, genres, year")
      .eq("user_id", userId)
      .eq("status", "watched"),
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
  }

  return {
    totalEntries,
    ratedEntries,
    completedByKind,
    uniqueGenres: genreSet.size,
    uniqueDecades: decadeSet.size,
    maxSameDayEntries,
    longestDailyStreak,
  };
}

function progressFor(criterion: BadgeCriterion, stats: BadgeStats): BadgeProgress {
  const target = criterion.target;
  switch (criterion.kind) {
    case "watch_entries_count":
      return { current: Math.min(stats.totalEntries, target), target };
    case "ratings_count":
      return { current: Math.min(stats.ratedEntries, target), target };
    case "media_completed_count":
      return { current: Math.min(stats.completedByKind[criterion.mediaKind], target), target };
    case "unique_genres_count":
      return { current: Math.min(stats.uniqueGenres, target), target };
    case "unique_decades_count":
      return { current: Math.min(stats.uniqueDecades, target), target };
    case "same_day_entries":
      return { current: Math.min(stats.maxSameDayEntries, target), target };
    case "daily_streak":
      return { current: Math.min(stats.longestDailyStreak, target), target };
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
  const earnedRes = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);
  if (earnedRes.error) return [];

  const alreadyEarned = new Set(earnedRes.data?.map((r) => r.badge_id) ?? []);
  const pending = BADGE_CATALOG.filter((b) => !alreadyEarned.has(b.id));
  if (pending.length === 0) return [];

  const stats = await loadStats(supabase, userId);

  const newlyEarned: BadgeDefinition[] = [];
  for (const badge of pending) {
    const { current, target } = progressFor(badge.criterion, stats);
    if (current >= target) newlyEarned.push(badge);
  }
  if (newlyEarned.length === 0) return [];

  const insertRes = await supabase
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

  const [earnedRes, stats] = await Promise.all([
    supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
    loadStats(supabase, userId),
  ]);

  const earnedMap = new Map<string, string>();
  for (const row of earnedRes.data ?? []) {
    earnedMap.set(row.badge_id, row.earned_at);
  }

  return BADGE_CATALOG.map((badge) => ({
    ...badge,
    progress: progressFor(badge.criterion, stats),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }));
}
