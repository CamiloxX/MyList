import { z } from "zod";

export const threadCreateSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});
export type ThreadCreateInput = z.infer<typeof threadCreateSchema>;

export const postCreateSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(10000),
});
export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const postEditSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(10000),
});
export type PostEditInput = z.infer<typeof postEditSchema>;

export const categoryCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug solo puede tener letras minúsculas, números y guiones"),
  name: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  displayOrder: z.number().int().min(0).max(1000).optional(),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
