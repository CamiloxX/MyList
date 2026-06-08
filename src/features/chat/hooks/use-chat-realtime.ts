"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatAuthor, ChatMessage, ChatMessageListItem } from "../types";

/**
 * Subscribes to the global chat room over Supabase Realtime.
 *
 * The postgres_changes payload carries only the chat_messages row — not the
 * author profile — so we keep a client-side cache of authors and resolve any
 * unknown user_id with a one-off profiles fetch. Authors are public-readable
 * for authenticated viewers (profiles_select_authenticated), which is who
 * reaches the chat in practice (the app sits behind login).
 */
export function useChatRealtime(initial: ChatMessageListItem[]) {
  const [messages, setMessages] = useState<ChatMessageListItem[]>(initial);
  const supabaseRef = useRef(createClient());
  const authorCacheRef = useRef(new Map<string, ChatAuthor | null>());

  // Seed the author cache from the server-rendered messages so we don't refetch
  // profiles we already have.
  if (authorCacheRef.current.size === 0) {
    for (const m of initial) {
      if (m.user_id) authorCacheRef.current.set(m.user_id, m.author);
    }
  }

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function resolveAuthor(userId: string | null): Promise<ChatAuthor | null> {
      if (!userId) return null;
      const cache = authorCacheRef.current;
      if (cache.has(userId)) return cache.get(userId) ?? null;

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_admin")
        .eq("id", userId)
        .maybeSingle();

      const author: ChatAuthor | null = data
        ? {
            id: data.id,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            isAdmin: data.is_admin ?? false,
          }
        : null;
      cache.set(userId, author);
      return author;
    }

    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const row = payload.new as ChatMessage;
          if (row.deleted_at) return;
          const author = await resolveAuthor(row.user_id);
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, { ...row, author }],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setMessages((prev) => prev.filter((m) => m.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return messages;
}
