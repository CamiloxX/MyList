import type { MediaKind } from "@/features/library/status";

export type BadgeCriterion =
  | { kind: "watch_entries_count"; target: number }
  | { kind: "media_completed_count"; mediaKind: MediaKind; target: number }
  | { kind: "ratings_count"; target: number }
  | { kind: "unique_genres_count"; target: number }
  | { kind: "unique_decades_count"; target: number }
  | { kind: "same_day_entries"; target: number }
  | { kind: "daily_streak"; target: number };

export type BadgeTier = "bronze" | "silver" | "gold";

export interface BadgeDefinition {
  id: string;
  criterion: BadgeCriterion;
  iconKey: string;
  i18nKey: string;
  tier: BadgeTier;
}

export interface BadgeProgress {
  current: number;
  target: number;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export type BadgeWithStatus = BadgeDefinition & {
  progress: BadgeProgress;
  earnedAt: string | null;
};

/**
 * Snapshot of all aggregates needed to evaluate every badge in the catalog.
 * Computed once per evaluation pass to avoid N round-trips to Supabase.
 */
export interface BadgeStats {
  totalEntries: number;
  ratedEntries: number;
  completedByKind: Record<MediaKind, number>;
  uniqueGenres: number;
  uniqueDecades: number;
  maxSameDayEntries: number;
  longestDailyStreak: number;
}
