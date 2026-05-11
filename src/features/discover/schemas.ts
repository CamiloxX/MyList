import { z } from "zod";

export const DISCOVER_TABS = ["trending", "genre", "for-you"] as const;
export type DiscoverTab = (typeof DISCOVER_TABS)[number];

export const DISCOVER_TYPES = ["movie", "tv", "anime"] as const;
export type DiscoverType = (typeof DISCOVER_TYPES)[number];

export const discoverTabSchema = z.enum(DISCOVER_TABS);
export const discoverTypeSchema = z.enum(DISCOVER_TYPES);

/** Parsed search params for the Discover page. */
export const discoverFiltersSchema = z.object({
  tab: discoverTabSchema.catch("trending"),
  type: discoverTypeSchema.catch("movie"),
  /** Genre id. TMDB uses numeric ids; Jikan also exposes numeric mal_ids for genres. */
  genre: z.coerce.number().int().positive().optional().catch(undefined),
  year: z.coerce.number().int().min(1900).max(2100).optional().catch(undefined),
});

export type DiscoverFiltersParsed = z.infer<typeof discoverFiltersSchema>;
