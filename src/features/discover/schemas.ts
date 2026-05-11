import { z } from "zod";

export const DISCOVER_TABS = ["trending", "genre", "for-you"] as const;
export type DiscoverTab = (typeof DISCOVER_TABS)[number];

export const DISCOVER_TYPES = ["movie", "tv", "anime"] as const;
export type DiscoverType = (typeof DISCOVER_TYPES)[number];

/**
 * Region codes the UI exposes for streaming-provider filtering. Picked to
 * cover the user's stated focus on the Americas, plus Spain. Add more by
 * dropping ISO-3166-1 alpha-2 codes here — TMDB supports the full list.
 */
export const DISCOVER_REGIONS = ["CO", "MX", "AR", "CL", "BR", "US", "ES"] as const;
export type DiscoverRegion = (typeof DISCOVER_REGIONS)[number];
export const DEFAULT_REGION: DiscoverRegion = "CO";

export const discoverTabSchema = z.enum(DISCOVER_TABS);
export const discoverTypeSchema = z.enum(DISCOVER_TYPES);
export const discoverRegionSchema = z.enum(DISCOVER_REGIONS);

/** Parsed search params for the Discover page. */
export const discoverFiltersSchema = z.object({
  tab: discoverTabSchema.catch("trending"),
  type: discoverTypeSchema.catch("movie"),
  /** Genre id. TMDB uses numeric ids; Jikan also exposes numeric mal_ids for genres. */
  genre: z.coerce.number().int().positive().optional().catch(undefined),
  year: z.coerce.number().int().min(1900).max(2100).optional().catch(undefined),
  /** Streaming provider TMDB id (e.g. 8 = Netflix). Only valid for movie/tv. */
  provider: z.coerce.number().int().positive().optional().catch(undefined),
  /** Region for the streaming-provider catalog. Falls back to DEFAULT_REGION. */
  region: discoverRegionSchema.catch(DEFAULT_REGION),
  /** 1-based pagination. */
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

export type DiscoverFiltersParsed = z.infer<typeof discoverFiltersSchema>;
