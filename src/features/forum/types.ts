import type { Database } from "@/types/database";

export type ForumCategory = Database["public"]["Tables"]["forum_categories"]["Row"];
export type ForumThread = Database["public"]["Tables"]["forum_threads"]["Row"];
export type ForumPost = Database["public"]["Tables"]["forum_posts"]["Row"];

export type ForumAuthor = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  badgeIds: string[];
};

export type ForumThreadListItem = ForumThread & {
  author: ForumAuthor | null;
};

export type ForumPostListItem = ForumPost & {
  author: ForumAuthor | null;
  likeCount: number;
  likedByMe: boolean;
};

export type ForumViewer = {
  userId: string;
  isAdmin: boolean;
} | null;
