import "server-only";

import { fetchBadgesByUserIdsWith } from "@/features/badges/queries";
import type { BadgeDefinition } from "@/features/badges/types";
import type { MediaKind } from "@/features/library/status";
import {
  type GenreCount,
  getActivityStatsForUser,
  getLibraryBreakdownForUser,
  getTopRatedMediaForUser,
  getUserOverviewForUser,
  type TopRatedItem,
  type UserOverview,
} from "@/features/stats/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { USERNAME_MAX, USERNAME_MIN, USERNAME_REGEX } from "./schemas";

export type RecentActivityItem = {
  id: string;
  title: string;
  posterUrl: string | null;
  kind: MediaKind;
  year: number | null;
  watchedOn: string;
  rating: number | null;
};

export type PublicProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  badges: BadgeDefinition[];
  overview: UserOverview;
  streak: { current: number; longest: number };
  topGenres: GenreCount[];
  topRated: TopRatedItem[];
  recent: RecentActivityItem[];
};

/**
 * Assembles the public-facing profile for `/u/<username>`. This module is the
 * single trust boundary for public profile data:
 *
 * - It reads via the SERVICE-ROLE client (RLS is bypassed) because the visitor
 *   is typically logged out, so every query is filtered by the resolved
 *   `user_id` EXPLICITLY (the stats cores enforce this) — never rely on RLS here.
 * - The `is_public` gate runs BEFORE any stats/badge/activity query, so a
 *   private (or non-existent) handle leaks nothing.
 * - The returned object never includes the profile uuid.
 *
 * Returns null for: malformed handle, unknown handle, or a profile that hasn't
 * opted in (`is_public = false`). The caller maps null to a 404.
 */
export async function getPublicProfileByUsername(
  username: string,
  locale: "es" | "en",
): Promise<PublicProfile | null> {
  // Reject garbage before touching the DB (also avoids a citext lookup on junk).
  const handle = username.trim().toLowerCase();
  if (
    handle.length < USERNAME_MIN ||
    handle.length > USERNAME_MAX ||
    !USERNAME_REGEX.test(handle)
  ) {
    return null;
  }

  const admin = createServiceRoleClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_public, featured_badge_ids")
    .eq("username", handle)
    .maybeSingle();

  // Gate runs before any stats query. Two early returns keep optional-chaining
  // happy and let TS narrow `profile.username` to a non-null string below.
  if (!profile?.is_public) return null;
  if (!profile.username) return null;

  const userId = profile.id;

  const [overview, activity, breakdown, topRated, badgesMap, recentRes] = await Promise.all([
    getUserOverviewForUser(admin, userId),
    getActivityStatsForUser(admin, userId),
    getLibraryBreakdownForUser(admin, userId, locale),
    getTopRatedMediaForUser(admin, userId, 5),
    fetchBadgesByUserIdsWith(admin, [userId]),
    admin
      .from("watch_entries")
      .select("id, watched_on, rating, media_items!inner ( id, title, poster_url, kind, year )")
      .eq("user_id", userId)
      .order("watched_on", { ascending: false })
      .limit(8),
  ]);

  const recent: RecentActivityItem[] = (recentRes.data ?? []).map((row) => {
    // PostgREST returns the to-one embed as an object; type inference can widen
    // it, so cast (same pattern as the stats queries).
    const media = row.media_items as unknown as {
      id: string;
      title: string;
      poster_url: string | null;
      kind: MediaKind;
      year: number | null;
    };
    return {
      id: media.id,
      title: media.title,
      posterUrl: media.poster_url,
      kind: media.kind,
      year: media.year,
      watchedOn: row.watched_on,
      rating: row.rating,
    };
  });

  return {
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    badges: badgesMap.get(userId) ?? [],
    overview,
    streak: { current: activity.currentStreak, longest: activity.longestStreak },
    topGenres: breakdown.topGenres,
    topRated,
    recent,
  };
}
