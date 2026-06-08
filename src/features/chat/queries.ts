import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ChatAuthor, ChatMessageListItem } from "./types";

const RECENT_LIMIT = 50;

/**
 * Most recent chat messages, oldest-first (ready to render top-to-bottom).
 * Authors are resolved as a lightweight aside (name, avatar, admin flag) —
 * no badges, since the chat is a fast-moving feed and the realtime client
 * resolves new authors the same way.
 */
export async function listRecentMessages(): Promise<ChatMessageListItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (error || !rows || rows.length === 0) return [];

  const authorIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => typeof v === "string")),
  );

  const authorMap = new Map<string, ChatAuthor>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_admin")
      .in("id", authorIds);
    for (const row of authors ?? []) {
      authorMap.set(row.id, {
        id: row.id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        isAdmin: row.is_admin ?? false,
      });
    }
  }

  // Reverse the desc fetch into chronological order for display.
  return rows
    .map((r) => ({ ...r, author: r.user_id ? (authorMap.get(r.user_id) ?? null) : null }))
    .reverse();
}
