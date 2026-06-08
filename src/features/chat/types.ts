import type { Database } from "@/types/database";

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export type ChatAuthor = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export type ChatMessageListItem = ChatMessage & {
  author: ChatAuthor | null;
};

// Active moderation state of the current viewer in the global room.
// "mute" = read-only; "ban" = no chat at all.
export type ChatRestriction = "mute" | "ban" | null;
