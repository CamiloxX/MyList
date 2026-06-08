import "server-only";

import { fetchBadgesByUserIds } from "@/features/badges/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { TitleCommentAuthor, TitleCommentListItem } from "./types";

type MediaSource = Database["public"]["Enums"]["media_source"];
type MediaKind = Database["public"]["Enums"]["media_kind"];

export async function listCommentsByTitle(args: {
  source: MediaSource;
  sourceId: string;
  kind: MediaKind;
}): Promise<TitleCommentListItem[]> {
  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("title_comments")
    .select("*")
    .eq("source", args.source)
    .eq("source_id", args.sourceId)
    .eq("kind", args.kind)
    .order("created_at", { ascending: false });

  if (error || !comments) return [];
  if (comments.length === 0) return [];

  const authorIds = Array.from(
    new Set(comments.map((c) => c.user_id).filter((v): v is string => typeof v === "string")),
  );

  if (authorIds.length === 0) {
    return comments.map((c) => ({ ...c, author: null }));
  }

  const [{ data: authors }, badgesByUser] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_admin")
      .in("id", authorIds),
    fetchBadgesByUserIds(authorIds),
  ]);

  const authorMap = new Map<string, TitleCommentAuthor>();
  for (const row of authors ?? []) {
    authorMap.set(row.id, {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      badges: badgesByUser.get(row.id) ?? [],
      isAdmin: row.is_admin ?? false,
    });
  }

  return comments.map((c) => ({
    ...c,
    author: c.user_id ? (authorMap.get(c.user_id) ?? null) : null,
  }));
}

export async function getCurrentUserAdminInfo(): Promise<{
  userId: string;
  isAdmin: boolean;
} | null> {
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
