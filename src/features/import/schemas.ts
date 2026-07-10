import { z } from "zod";

// Client-safe on purpose (NO "server-only"): the import card parses the file
// in the browser for instant feedback before the server re-validates.

export const IMPORT_LIMITS = {
  maxItems: 10_000,
  maxEntries: 50_000,
  maxFileBytes: 5 * 1024 * 1024,
} as const;

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)));

// "mal" is accepted and normalized for future external imports; the DB enum
// only knows tmdb/anilist (anime rows use MAL ids under source "anilist").
const importSourceSchema = z
  .union([z.literal("tmdb"), z.literal("anilist"), z.literal("mal")])
  .transform((source) => (source === "mal" ? "anilist" : source));

export const importItemSchema = z.object({
  id: z.string().uuid(),
  source: importSourceSchema,
  // Same anti-injection shape as addToLibrarySchema: provider ids are digits.
  source_id: z.string().regex(/^[0-9]+$/),
  kind: z.enum(["movie", "tv", "anime"]),
  title: z.string().min(1).max(500),
  original_title: z.string().max(500).nullable().optional(),
  year: z.number().int().min(1800).max(2200).nullable().optional(),
  runtime_minutes: z.number().int().min(0).max(100_000).nullable().optional(),
  episode_count: z.number().int().min(0).max(100_000).nullable().optional(),
  // Absent in exports older than format_version 1.
  episodes_watched: z.number().int().min(0).max(100_000).nullable().optional(),
  poster_url: z.string().max(2000).nullable().optional(),
  status: z.enum(["watching", "watched", "pending", "dropped"]),
  genres: z.unknown().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type ImportItem = z.infer<typeof importItemSchema>;

export const importEntrySchema = z.object({
  id: z.string().uuid(),
  media_item_id: z.string().uuid(),
  watched_on: isoDateSchema,
  rating: z.number().int().min(1).max(10).nullable().optional(),
  platform: z.string().max(60).nullable().optional(),
  season_number: z.number().int().min(0).max(1000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  created_at: z.string().optional(),
});
export type ImportEntry = z.infer<typeof importEntrySchema>;

export const importPayloadSchema = z.object({
  format_version: z.number().int().min(1).optional(),
  exported_at: z.string().optional(),
  user_email: z.string().nullable().optional(),
  items_count: z.number().optional(),
  entries_count: z.number().optional(),
  items: z.array(importItemSchema).max(IMPORT_LIMITS.maxItems),
  entries: z.array(importEntrySchema).max(IMPORT_LIMITS.maxEntries),
});
export type ImportPayload = z.infer<typeof importPayloadSchema>;

export const importOptionsSchema = z.object({
  dryRun: z.boolean(),
  // merge: newer payload data updates status and fills empty fields.
  // skip: existing titles are left untouched.
  policy: z.enum(["merge", "skip"]),
});
export type ImportOptions = z.infer<typeof importOptionsSchema>;

export type ImportSummary = {
  newItems: number;
  mergedItems: number;
  skippedItems: number;
  newEntries: number;
  duplicateEntries: number;
  /** Entries dropped because their media_item_id is not in the file. */
  warnings: number;
};
