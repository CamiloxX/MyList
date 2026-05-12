-- ============================================================================
-- Migration 003: per-season tracking on watch_entries
-- ============================================================================
-- Adds an optional `season_number` to watch_entries so a TV show's seasons can
-- be marked as watched individually. Season 0 is reserved for "specials" in
-- TMDB; we accept it but don't surface it in the UI by default.
--
-- Existing entries (movies, anime, untracked TV) keep season_number = null
-- and behave exactly as before.
-- ============================================================================

alter table public.watch_entries
  add column season_number smallint check (season_number is null or season_number >= 0);

-- Partial index: most queries only care about rows that ARE tagged with a
-- season. Skipping the nulls keeps the index small.
create index watch_entries_media_season_idx
  on public.watch_entries (media_item_id, season_number)
  where season_number is not null;
