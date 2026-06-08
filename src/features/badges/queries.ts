import "server-only";

import { createClient } from "@/lib/supabase/server";
import { loadBadgeMap } from "./catalog";
import { getAllBadgesWithStatus } from "./evaluator";
import type { BadgeDefinition, BadgeWithStatus, EarnedBadge } from "./types";

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
 * "recent achievements" mini-section. Drops ids missing from the catalog
 * (e.g. a badge that was deleted by an admin).
 */
export async function getRecentEarnedBadges(limit = 3): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [earnedRes, catalog] = await Promise.all([
    supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(limit),
    loadBadgeMap(supabase),
  ]);

  if (earnedRes.error || !earnedRes.data) return [];

  const result: EarnedBadge[] = [];
  for (const row of earnedRes.data) {
    const def = catalog.get(row.badge_id);
    if (def) result.push({ ...def, earnedAt: row.earned_at });
  }
  return result;
}

/**
 * Returns up to 4 most recently earned badges per user, keyed by user id.
 * Used to render badge chips next to author names in comment threads.
 */
export async function fetchBadgesByUserIds(
  userIds: string[],
): Promise<Map<string, BadgeDefinition[]>> {
  const map = new Map<string, BadgeDefinition[]>();
  if (userIds.length === 0) return map;
  const supabase = await createClient();
  const [badgesRes, catalog] = await Promise.all([
    supabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at")
      .in("user_id", userIds)
      .order("earned_at", { ascending: false }),
    loadBadgeMap(supabase),
  ]);
  for (const row of badgesRes.data ?? []) {
    const def = catalog.get(row.badge_id);
    if (!def) continue;
    const list = map.get(row.user_id) ?? [];
    if (list.length < 4) list.push(def);
    map.set(row.user_id, list);
  }
  return map;
}
