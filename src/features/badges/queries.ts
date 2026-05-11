import "server-only";

import { createClient } from "@/lib/supabase/server";
import { BADGE_BY_ID } from "./catalog";
import { getAllBadgesWithStatus } from "./evaluator";
import type { BadgeWithStatus, EarnedBadge } from "./types";

/**
 * Server entry-point for the /badges page.
 * Returns null when the user is not signed in (caller redirects).
 */
export async function getBadgesForCurrentUser(): Promise<BadgeWithStatus[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return getAllBadgesWithStatus(supabase, user.id);
}

/**
 * Latest N earned badges for the current user — used by the /settings
 * "recent achievements" mini-section. Filters out unknown badge ids
 * (which can happen if a badge was removed from the catalog).
 */
export async function getRecentEarnedBadges(limit = 3): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .filter((row) => BADGE_BY_ID.has(row.badge_id))
    .map((row) => ({ badgeId: row.badge_id, earnedAt: row.earned_at }));
}
