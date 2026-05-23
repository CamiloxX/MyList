import type { BadgeDefinition } from "./types";

/**
 * Source of truth for every badge in MyList. Adding a badge here is enough —
 * the evaluator and the /badges page pick it up automatically.
 *
 * Conventions:
 * - `id` is a stable string never shown to the user (used as PK in user_badges).
 * - `iconKey` must be a valid Lucide icon name (resolved in lucide-icon.tsx).
 * - `i18nKey` resolves to `badges.items.<i18nKey>.{name,description}`.
 */
export const BADGE_CATALOG: ReadonlyArray<BadgeDefinition> = [
  {
    id: "first_watch",
    criterion: { kind: "watch_entries_count", target: 1 },
    iconKey: "Sparkles",
    i18nKey: "first_watch",
    tier: "bronze",
  },
  {
    id: "cinephile_10",
    criterion: { kind: "media_completed_count", mediaKind: "movie", target: 10 },
    iconKey: "Film",
    i18nKey: "cinephile_10",
    tier: "bronze",
  },
  {
    id: "series_finisher_5",
    criterion: { kind: "media_completed_count", mediaKind: "tv", target: 5 },
    iconKey: "Tv",
    i18nKey: "series_finisher_5",
    tier: "silver",
  },
  {
    id: "otaku_5",
    criterion: { kind: "media_completed_count", mediaKind: "anime", target: 5 },
    iconKey: "Sword",
    i18nKey: "otaku_5",
    tier: "silver",
  },
  {
    id: "critic_20",
    criterion: { kind: "ratings_count", target: 20 },
    iconKey: "Star",
    i18nKey: "critic_20",
    tier: "bronze",
  },
  {
    id: "marathon_3",
    criterion: { kind: "same_day_entries", target: 3 },
    iconKey: "Zap",
    i18nKey: "marathon_3",
    tier: "silver",
  },
  {
    id: "genre_explorer_5",
    criterion: { kind: "unique_genres_count", target: 5 },
    iconKey: "Compass",
    i18nKey: "genre_explorer_5",
    tier: "silver",
  },
  {
    id: "streak_7",
    criterion: { kind: "daily_streak", target: 7 },
    iconKey: "Flame",
    i18nKey: "streak_7",
    tier: "gold",
  },
  {
    id: "cinephile_50",
    criterion: { kind: "media_completed_count", mediaKind: "movie", target: 50 },
    iconKey: "Clapperboard",
    i18nKey: "cinephile_50",
    tier: "gold",
  },
  {
    id: "series_finisher_20",
    criterion: { kind: "media_completed_count", mediaKind: "tv", target: 20 },
    iconKey: "MonitorPlay",
    i18nKey: "series_finisher_20",
    tier: "gold",
  },
  {
    id: "otaku_20",
    criterion: { kind: "media_completed_count", mediaKind: "anime", target: 20 },
    iconKey: "Swords",
    i18nKey: "otaku_20",
    tier: "gold",
  },
  {
    id: "critic_50",
    criterion: { kind: "ratings_count", target: 50 },
    iconKey: "Award",
    i18nKey: "critic_50",
    tier: "silver",
  },
  {
    id: "marathon_5",
    criterion: { kind: "same_day_entries", target: 5 },
    iconKey: "BatteryWarning",
    i18nKey: "marathon_5",
    tier: "gold",
  },
  {
    id: "streak_30",
    criterion: { kind: "daily_streak", target: 30 },
    iconKey: "Trophy",
    i18nKey: "streak_30",
    tier: "gold",
  },
  {
    id: "decade_explorer_4",
    criterion: { kind: "unique_decades_count", target: 4 },
    iconKey: "Hourglass",
    i18nKey: "decade_explorer_4",
    tier: "silver",
  },
] as const;

export const BADGE_BY_ID: ReadonlyMap<string, BadgeDefinition> = new Map(
  BADGE_CATALOG.map((b) => [b.id, b]),
);
