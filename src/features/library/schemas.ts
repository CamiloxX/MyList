import { z } from "zod";

export const PLATFORMS = [
  // Streaming
  "Netflix",
  "Prime Video",
  "Disney+",
  "HBO Max",
  "Apple TV+",
  "Crunchyroll",
  "YouTube",
  // Juegos
  "Steam",
  "Epic Games",
  "Origin",
  "EA",
  "GOG",
  "Ubisoft Connect",
  "Battle.net",
  "PlayStation",
  "Rockstar Games",
  // Otros
  "Cine",
  "Otra",
] as const;
export type Platform = (typeof PLATFORMS)[number];

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)")
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Fecha inválida" });

export const watchEntrySchema = z.object({
  mediaItemId: z.string().uuid(),
  watchedOn: isoDateSchema,
  rating: z
    .number()
    .int("Calificación entera")
    .min(1, "Mínimo 1")
    .max(10, "Máximo 10")
    .nullable()
    .optional(),
  platform: z.string().max(60).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type WatchEntryInput = z.infer<typeof watchEntrySchema>;

export const addToLibrarySchema = z.object({
  source: z.enum(["tmdb", "anilist"]),
  sourceId: z.string().min(1),
  kind: z.enum(["movie", "tv", "anime"]),
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  posterUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  runtimeMinutes: z.number().nullable().optional(),
  episodeCount: z.number().nullable().optional(),
  genres: z.array(z.union([z.string(), z.number()])).default([]),
  rawMetadata: z.unknown().optional(),
});
export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;

export const setEpisodesWatchedSchema = z.object({
  mediaItemId: z.string().uuid(),
  count: z.number().int().min(0).max(100_000),
});
export type SetEpisodesWatchedInput = z.infer<typeof setEpisodesWatchedSchema>;
