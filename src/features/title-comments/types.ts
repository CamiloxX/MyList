import type { Database } from "@/types/database";

export type TitleComment = Database["public"]["Tables"]["title_comments"]["Row"];

export type TitleCommentAuthor = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  badgeIds: string[];
  isAdmin: boolean;
};

export type TitleCommentListItem = TitleComment & {
  author: TitleCommentAuthor | null;
};
