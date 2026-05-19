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

/**
 * Returns up to 4 most recently earned badge ids per user, keyed by user id.
 * Used to render badge chips next to author names in comment threads.
 */
export async function fetchBadgesByUserIds(userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (userIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("user_id, badge_id, earned_at")
    .in("user_id", userIds)
    .order("earned_at", { ascending: false });
  for (const row of data ?? []) {
    const list = map.get(row.user_id) ?? [];
    if (list.length < 4) list.push(row.badge_id);
    map.set(row.user_id, list);
  }
  return map;
}
