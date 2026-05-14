import { z } from "zod";

export const titleRefSchema = z.object({
  source: z.enum(["tmdb", "anilist"]),
  sourceId: z.string().min(1),
  kind: z.enum(["movie", "tv", "anime"]),
});
export type TitleRef = z.infer<typeof titleRefSchema>;

export const commentCreateSchema = titleRefSchema.extend({
  body: z.string().min(1).max(4000),
});
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentEditSchema = z.object({
  commentId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
export type CommentEditInput = z.infer<typeof commentEditSchema>;
