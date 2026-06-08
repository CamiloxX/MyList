import type { MediaKind } from "@/features/library/status";

/** Catalog source for a title-based badge — mirrors the media_source enum. */
export type MediaSource = "tmdb" | "anilist";

/**
 * Mirrors the `criterion` JSON stored on each row of public.badges.
 * Counter-style criteria are evaluated against aggregate stats; `title_season`
 * is unlocked by watching a specific season of a specific title; `manual`
 * is never auto-granted (an admin awards it by hand).
 */
export type BadgeCriterion =
  | { kind: "watch_entries_count"; target: number }
  | { kind: "media_completed_count"; mediaKind: MediaKind; target: number }
  | { kind: "ratings_count"; target: number }
  | { kind: "unique_genres_count"; target: number }
  | { kind: "unique_decades_count"; target: number }
  | { kind: "same_day_entries"; target: number }
  | { kind: "daily_streak"; target: number }
  | {
      kind: "title_season";
      source: MediaSource;
      sourceId: string;
      mediaKind: MediaKind;
      season: number;
    }
  | {
      kind: "title_completed";
      source: MediaSource;
      sourceId: string;
      mediaKind: MediaKind;
      /** Display-only label captured when the admin picks the title. */
      title?: string;
    }
  | {
      kind: "title_episodes";
      source: "anilist";
      sourceId: string;
      episodes: number;
      /** Display-only label captured when the admin picks the title. */
      title?: string;
    }
  | { kind: "manual" };

export type BadgeCriterionKind = BadgeCriterion["kind"];

export type BadgeTier = "bronze" | "silver" | "gold";

/** Max badges a user can showcase next to their name (comments / profile). */
export const MAX_FEATURED_BADGES = 4;

/**
 * A badge ready to display: its text is already resolved (from next-intl for
 * built-ins, or straight from the DB for admin-created ones), and its icon is
 * either a Lucide key (`iconKey`) or an uploaded image (`iconUrl`).
 */
export interface BadgeDefinition {
  id: string;
  criterion: BadgeCriterion;
  iconKey: string | null;
  iconUrl: string | null;
  name: string;
  description: string;
  tier: BadgeTier;
}

export interface BadgeProgress {
  current: number;
  target: number;
}

export type BadgeWithStatus = BadgeDefinition & {
  progress: BadgeProgress;
  earnedAt: string | null;
};

/** A badge the user has unlocked, with the unlock timestamp. */
export type EarnedBadge = BadgeDefinition & {
  earnedAt: string;
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
  /** Set of `${source}:${sourceId}:${season}` the user has marked watched. */
  watchedTitleSeasons: Set<string>;
  /** Set of `${source}:${sourceId}` of titles the user marked as watched (status). */
  watchedTitles: Set<string>;
  /** Map of `${source}:${sourceId}` → episodes_watched, anime only (title_episodes). */
  episodesByTitle: Map<string, number>;
}
