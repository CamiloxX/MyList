/**
 * Normalized airing state for a series/anime, shared across TMDB and Jikan.
 * - airing: currently broadcasting or returning with more episodes coming
 * - upcoming: announced but not aired yet
 * - ended: finished or canceled
 * - unknown: source didn't say (don't render a badge)
 */
export type AiringStatus = "airing" | "ended" | "upcoming" | "unknown";
