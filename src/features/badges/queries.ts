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
 * Every badge the current user has unlocked (resolved, most-recent first) plus
 * their currently featured badge ids. Powers the "featured badges" picker in
 * settings. Lighter than getAllBadgesWithStatus — no re-evaluation pass.
 */
export async function getEarnedBadgesForCurrentUser(): Promise<{
  badges: BadgeDefinition[];
  featured: string[];
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [earnedRes, profileRes, catalog] = await Promise.all([
    supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
    supabase.from("profiles").select("featured_badge_ids").eq("id", user.id).maybeSingle(),
    loadBadgeMap(supabase),
  ]);

  const badges: BadgeDefinition[] = [];
  for (const row of earnedRes.data ?? []) {
    const def = catalog.get(row.badge_id);
    if (def) badges.push(def);
  }
  return { badges, featured: profileRes.data?.featured_badge_ids ?? [] };
}

/**
 * Returns up to 4 badges per user to chip next to their name in comment
 * threads. Prefers the user's chosen featured badges (in their order); falls
 * back to the most recently earned when none are set.
 */
export async function fetchBadgesByUserIds(
  userIds: string[],
): Promise<Map<string, BadgeDefinition[]>> {
  const map = new Map<string, BadgeDefinition[]>();
  if (userIds.length === 0) return map;
  const supabase = await createClient();
  const [badgesRes, profilesRes, catalog] = await Promise.all([
    supabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at")
      .in("user_id", userIds)
      .order("earned_at", { ascending: false }),
    supabase.from("profiles").select("id, featured_badge_ids").in("id", userIds),
    loadBadgeMap(supabase),
  ]);

  // Earned badge ids per user (most-recent first) + a membership set.
  const recentByUser = new Map<string, string[]>();
  const earnedByUser = new Map<string, Set<string>>();
  for (const row of badgesRes.data ?? []) {
    const recent = recentByUser.get(row.user_id) ?? [];
    recent.push(row.badge_id);
    recentByUser.set(row.user_id, recent);
    const set = earnedByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.badge_id);
    earnedByUser.set(row.user_id, set);
  }

  const featuredByUser = new Map<string, string[]>();
  for (const p of profilesRes.data ?? []) {
    if (Array.isArray(p.featured_badge_ids) && p.featured_badge_ids.length > 0) {
      featuredByUser.set(p.id, p.featured_badge_ids);
    }
  }

  for (const userId of userIds) {
    const featured = featuredByUser.get(userId);
    const earned = earnedByUser.get(userId) ?? new Set<string>();
    // Chosen featured (kept only if still earned, in the user's order), else
    // the most recently earned. Capped at 4 chips.
    const ids = (
      featured ? featured.filter((id) => earned.has(id)) : (recentByUser.get(userId) ?? [])
    ).slice(0, 4);
    const defs: BadgeDefinition[] = [];
    for (const id of ids) {
      const def = catalog.get(id);
      if (def) defs.push(def);
    }
    if (defs.length > 0) map.set(userId, defs);
  }
  return map;
}
