import "server-only";

import { z } from "zod";
import { tmdbFetch } from "./client";

const belongsToCollectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
});

const movieCollectionRefSchema = z.object({
  id: z.number(),
  belongs_to_collection: belongsToCollectionSchema.nullable().optional(),
});

const collectionPartSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  vote_average: z.number().nullable().optional(),
});
export type TmdbCollectionPart = z.infer<typeof collectionPartSchema>;

const collectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  parts: z.array(collectionPartSchema).default([]),
});

/** The collection (franchise) a movie belongs to, if any. From `/movie/{id}`. */
export async function getMovieCollectionId(
  movieId: string | number,
): Promise<{ id: number; name: string } | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/movie/${movieId}`, { revalidate: 86400 });
    const parsed = movieCollectionRefSchema.parse(raw);
    return parsed.belongs_to_collection
      ? { id: parsed.belongs_to_collection.id, name: parsed.belongs_to_collection.name }
      : null;
  } catch (error) {
    console.warn("[tmdb-collection-id] failed:", error);
    return null;
  }
}

const movieBriefSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
});

/** Minimal movie card data by id (title/poster/year). For resolving the curated
 *  franchise lists, which store only ids. Cached 24h; null on failure. */
export async function getTmdbMovieBrief(movieId: string | number): Promise<{
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
} | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/movie/${movieId}`, { revalidate: 86400 });
    const m = movieBriefSchema.parse(raw);
    return {
      id: m.id,
      title: m.title,
      posterPath: m.poster_path ?? null,
      releaseDate: m.release_date ?? null,
    };
  } catch (error) {
    console.warn("[tmdb-movie-brief] failed:", error);
    return null;
  }
}

const tvBriefSchema = z.object({
  id: z.number(),
  name: z.string(),
  poster_path: z.string().nullable().optional(),
  first_air_date: z.string().nullable().optional(),
});

/** Minimal TV card data by id (name/poster/year). For resolving curated TV
 *  franchises, which store only ids. Cached 24h; null on failure. */
export async function getTmdbTvBrief(tvId: string | number): Promise<{
  id: number;
  title: string;
  posterPath: string | null;
  year: number | null;
} | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/tv/${tvId}`, { revalidate: 86400 });
    const t = tvBriefSchema.parse(raw);
    return {
      id: t.id,
      title: t.name,
      posterPath: t.poster_path ?? null,
      year: t.first_air_date ? Number.parseInt(t.first_air_date.slice(0, 4), 10) || null : null,
    };
  } catch (error) {
    console.warn("[tmdb-tv-brief] failed:", error);
    return null;
  }
}

/** A collection's movies (`parts`). Order them by release_date for release order. */
export async function getTmdbCollection(
  collectionId: number,
): Promise<{ id: number; name: string; parts: TmdbCollectionPart[] } | null> {
  try {
    const raw = await tmdbFetch<unknown>(`/collection/${collectionId}`, { revalidate: 86400 });
    return collectionSchema.parse(raw);
  } catch (error) {
    console.warn("[tmdb-collection] failed:", error);
    return null;
  }
}
