import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ForumAuthor,
  ForumCategory,
  ForumPostListItem,
  ForumThread,
  ForumThreadListItem,
  ForumViewer,
} from "./types";

export async function getViewer(): Promise<ForumViewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, isAdmin: profile?.is_admin ?? false };
}

export async function listCategories(): Promise<ForumCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function listThreadsByCategory(categoryId: string): Promise<ForumThreadListItem[]> {
  const supabase = await createClient();
  const { data: threads, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("category_id", categoryId)
    .order("pinned", { ascending: false })
    .order("last_post_at", { ascending: false });

  if (error || !threads) return [];
  const authors = await fetchAuthors(threads.map((t) => t.user_id));
  return threads.map((t) => ({ ...t, author: authors.get(t.user_id) ?? null }));
}

export async function getThread(id: string): Promise<ForumThread | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("forum_threads").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listPostsByThread(
  threadId: string,
  viewerId: string | null,
): Promise<ForumPostListItem[]> {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = posts
    .map((p) => p.user_id)
    .filter((v): v is string => typeof v === "string");

  const [{ data: reactions }, authors] = await Promise.all([
    supabase.from("forum_reactions").select("post_id, user_id").in("post_id", postIds),
    fetchAuthors(authorIds),
  ]);

  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const r of reactions ?? []) {
    likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1);
    if (viewerId && r.user_id === viewerId) likedByMe.add(r.post_id);
  }

  return posts.map((p) => ({
    ...p,
    author: p.user_id ? (authors.get(p.user_id) ?? null) : null,
    likeCount: likeCount.get(p.id) ?? 0,
    likedByMe: likedByMe.has(p.id),
  }));
}

async function fetchAuthors(userIds: string[]): Promise<Map<string, ForumAuthor>> {
  const map = new Map<string, ForumAuthor>();
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return map;
  const supabase = await createClient();

  const [profilesResult, badgesByUser] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", unique),
    fetchBadgesByUserIds(unique),
  ]);

  for (const row of profilesResult.data ?? []) {
    map.set(row.id, {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      badgeIds: badgesByUser.get(row.id) ?? [],
    });
  }
  return map;
}

/**
 * Returns up to 4 most recently earned badge ids per user.
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
