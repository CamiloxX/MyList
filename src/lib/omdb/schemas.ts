import { z } from "zod";

/**
 * OMDb returns Ratings as an array of source/value pairs. We normalize this
 * downstream into a flat object keyed by source.
 */
const ratingEntrySchema = z.object({
  Source: z.string(),
  Value: z.string(),
});

/**
 * Successful response shape. Many fields are returned as the literal string
 * "N/A" instead of being absent, so callers must filter those out.
 */
const omdbHitSchema = z.object({
  Response: z.literal("True"),
  Title: z.string().optional(),
  Year: z.string().optional(),
  imdbID: z.string().optional(),
  imdbRating: z.string().optional(),
  imdbVotes: z.string().optional(),
  Metascore: z.string().optional(),
  Ratings: z.array(ratingEntrySchema).default([]),
});

const omdbMissSchema = z.object({
  Response: z.literal("False"),
  Error: z.string().optional(),
});

export const omdbResponseSchema = z.discriminatedUnion("Response", [omdbHitSchema, omdbMissSchema]);
export type OmdbResponse = z.infer<typeof omdbResponseSchema>;

/** Normalized rating set we expose to UI components. All fields are optional. */
export type OmdbRatings = {
  /** IMDb rating, e.g. "8.5" (out of 10). */
  imdb: string | null;
  /** Rotten Tomatoes "Tomatometer" percentage, e.g. "94". */
  rottenTomatoes: string | null;
  /** Metacritic score, e.g. "84" (out of 100). */
  metacritic: string | null;
};
