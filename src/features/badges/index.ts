export { loadBadgeCatalog, loadBadgeMap } from "./catalog";
export { BadgeCard } from "./components/badge-card";
export { BadgeIcon } from "./components/badge-icon";
export { BadgesGrid } from "./components/badges-grid";
export { evaluateAndPersist, getAllBadgesWithStatus } from "./evaluator";
export { useNotifyBadges } from "./notify";
export { getBadgesForCurrentUser, getRecentEarnedBadges } from "./queries";
export type {
  BadgeCriterion,
  BadgeCriterionKind,
  BadgeDefinition,
  BadgeProgress,
  BadgeStats,
  BadgeTier,
  BadgeWithStatus,
  EarnedBadge,
  MediaSource,
} from "./types";
