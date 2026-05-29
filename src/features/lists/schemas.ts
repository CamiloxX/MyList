import { z } from "zod";

export const LIST_NAME_MAX = 60;
export const LIST_DESCRIPTION_MAX = 200;

export const listFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre a la lista")
    .max(LIST_NAME_MAX, "Nombre muy largo"),
  description: z.string().trim().max(LIST_DESCRIPTION_MAX, "Descripción muy larga").optional(),
});
export type ListFormInput = z.infer<typeof listFormSchema>;

export const MAX_COVER_BYTES = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_COVER_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedCoverMime = (typeof ALLOWED_COVER_MIME)[number];
