"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatAuthor, ChatMessage, ChatMessageListItem, ChatRestriction } from "../types";

// How long a "typing" signal stays visible before it expires.
const TYPING_TTL_MS = 4000;
// Don't broadcast "typing" more than once per this interval while the user types.
const TYPING_THROTTLE_MS = 1500;

type TypingPayload = { userId: string; name: string };

/**
 * Subscribes to the global chat room over Supabase Realtime and returns the
 * live conversation plus presence-style extras:
 *
 * - `messages`: history + new/removed rows (postgres_changes). The payload only
 *   carries the chat_messages row, so unknown authors are resolved with a
 *   one-off profiles fetch (cached).
 * - `typingNames`: who is currently typing (ephemeral Broadcast, no DB).
 * - `restriction`: the viewer's own mute/ban, kept live so a ban hides the
 *   bubble (and an unban restores it) without a reload.
 * - `sendTyping`: throttled broadcaster to call on input change.
 */
export function useChatRealtime(args: {
  initial: ChatMessageListItem[];
  viewerId: string;
  viewerName: string;
  initialRestriction: ChatRestriction;
}) {
  const { initial, viewerId, viewerName, initialRestriction } = args;
  const [messages, setMessages] = useState<ChatMessageListItem[]>(initial);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [restriction, setRestriction] = useState<ChatRestriction>(initialRestriction);

  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const authorCacheRef = useRef(new Map<string, ChatAuthor | null>());
  const typingRef = useRef(new Map<string, { name: string; expires: number }>());
  const lastTypingSentRef = useRef(0);

  // Seed the author cache from the server-rendered messages.
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

      // resolve_authors() exposes only the safe author-card fields cross-user
      // (the blanket profiles read policy is removed for security).
      const { data: rows } = await supabase.rpc("resolve_authors", { ids: [userId] });
      const data = rows?.[0] ?? null;

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

    function publishTyping() {
      setTypingNames(
        Array.from(typingRef.current.values())
          .map((v) => v.name)
          .filter(Boolean),
      );
    }

    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const row = payload.new as ChatMessage;
          if (row.deleted_at) return;
          // Someone posting clears their typing indicator.
          typingRef.current.delete(row.user_id ?? "");
          publishTyping();
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_restrictions",
          filter: `user_id=eq.${viewerId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRestriction(null);
            return;
          }
          const row = payload.new as { type?: string; expires_at?: string | null };
          const active = row.type && (!row.expires_at || new Date(row.expires_at) > new Date());
          setRestriction(active ? (row.type as "mute" | "ban") : null);
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as TypingPayload;
        if (!p?.userId || p.userId === viewerId) return;
        typingRef.current.set(p.userId, {
          name: p.name ?? "",
          expires: Date.now() + TYPING_TTL_MS,
        });
        publishTyping();
      })
      .subscribe();

    channelRef.current = channel;

    // Prune expired typing signals periodically.
    const interval = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, v] of typingRef.current) {
        if (v.expires <= now) {
          typingRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) publishTyping();
    }, 1500);

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [viewerId]);

  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    void channel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: viewerId, name: viewerName } satisfies TypingPayload,
    });
  }, [viewerId, viewerName]);

  return { messages, typingNames, restriction, sendTyping };
}
