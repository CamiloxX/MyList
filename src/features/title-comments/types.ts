import type { BadgeDefinition } from "@/features/badges/types";
import type { Database } from "@/types/database";

export type TitleComment = Database["public"]["Tables"]["title_comments"]["Row"];

export type TitleCommentAuthor = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  badges: BadgeDefinition[];
  isAdmin: boolean;
};

export type TitleCommentListItem = TitleComment & {
  author: TitleCommentAuthor | null;
};
