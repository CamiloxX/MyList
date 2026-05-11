import { z } from "zod";

const imageSetSchema = z.object({
  image_url: z.string().nullable().optional(),
  small_image_url: z.string().nullable().optional(),
  large_image_url: z.string().nullable().optional(),
});

const genreSchema = z.object({
  mal_id: z.number(),
  type: z.string(),
  name: z.string(),
});

export const jikanAnimeSchema = z.object({
  mal_id: z.number(),
  url: z.string().optional(),
  images: z
    .object({
      jpg: imageSetSchema.optional(),
      webp: imageSetSchema.optional(),
    })
    .optional(),
  title: z.string(),
  title_english: z.string().nullable().optional(),
  title_japanese: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  episodes: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  season: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  scored_by: z.number().nullable().optional(),
  members: z.number().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  genres: z.array(genreSchema).default([]),
  studios: z.array(z.object({ mal_id: z.number(), name: z.string() })).default([]),
});
export type JikanAnime = z.infer<typeof jikanAnimeSchema>;

export const jikanSearchResponseSchema = z.object({
  data: z.array(jikanAnimeSchema),
});
export type JikanSearchResponse = z.infer<typeof jikanSearchResponseSchema>;

export const jikanGenreSchema = z.object({
  mal_id: z.number(),
  name: z.string(),
  count: z.number().optional(),
});
export type JikanGenre = z.infer<typeof jikanGenreSchema>;

export const jikanGenresResponseSchema = z.object({
  data: z.array(jikanGenreSchema),
});

/**
 * The /anime/{id}/recommendations endpoint wraps each suggestion under `entry`,
 * which only contains the bare minimum (mal_id, title, images). All optional
 * fields in jikanAnimeSchema are absent, so we accept it as-is and let cards
 * render with the missing data tolerated.
 */
const jikanRecommendationEntrySchema = z.object({
  entry: jikanAnimeSchema,
});

export const jikanRecommendationsResponseSchema = z.object({
  data: z.array(jikanRecommendationEntrySchema),
});
