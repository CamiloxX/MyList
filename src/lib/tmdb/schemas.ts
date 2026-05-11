import { z } from "zod";

/** Common base fields TMDB returns for any media type. */
const baseMediaSchema = z.object({
  id: z.number(),
  overview: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  vote_average: z.number().optional(),
  vote_count: z.number().optional(),
  popularity: z.number().optional(),
  genre_ids: z.array(z.number()).optional(),
  original_language: z.string().optional(),
});

export const tmdbMovieSchema = baseMediaSchema.extend({
  media_type: z.literal("movie"),
  title: z.string(),
  original_title: z.string().optional(),
  release_date: z.string().optional(),
});
export type TmdbMovie = z.infer<typeof tmdbMovieSchema>;

export const tmdbTvSchema = baseMediaSchema.extend({
  media_type: z.literal("tv"),
  name: z.string(),
  original_name: z.string().optional(),
  first_air_date: z.string().optional(),
});
export type TmdbTv = z.infer<typeof tmdbTvSchema>;

const tmdbPersonSchema = z.object({ media_type: z.literal("person") }).passthrough();

export const tmdbMultiResultSchema = z.discriminatedUnion("media_type", [
  tmdbMovieSchema,
  tmdbTvSchema,
  tmdbPersonSchema,
]);
export type TmdbMultiResult = z.infer<typeof tmdbMultiResultSchema>;

/** Result we expose to the UI: movies and tv only, normalized. */
export type TmdbSearchResult = TmdbMovie | TmdbTv;

export const tmdbMultiResponseSchema = z.object({
  page: z.number(),
  results: z.array(tmdbMultiResultSchema),
  total_pages: z.number(),
  total_results: z.number(),
});
export type TmdbMultiResponse = z.infer<typeof tmdbMultiResponseSchema>;

/**
 * `/discover/movie` returns rows that are guaranteed movies but lack
 * `media_type`. We attach it ourselves so downstream code can keep using the
 * same `TmdbSearchResult` discriminated union.
 */
const discoverMovieRowSchema = baseMediaSchema.extend({
  title: z.string(),
  original_title: z.string().optional(),
  release_date: z.string().optional(),
});

const discoverTvRowSchema = baseMediaSchema.extend({
  name: z.string(),
  original_name: z.string().optional(),
  first_air_date: z.string().optional(),
});

export const tmdbDiscoverMovieResponseSchema = z.object({
  page: z.number(),
  results: z.array(discoverMovieRowSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

export const tmdbDiscoverTvResponseSchema = z.object({
  page: z.number(),
  results: z.array(discoverTvRowSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

export const tmdbGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type TmdbGenre = z.infer<typeof tmdbGenreSchema>;

export const tmdbGenreListResponseSchema = z.object({
  genres: z.array(tmdbGenreSchema),
});
