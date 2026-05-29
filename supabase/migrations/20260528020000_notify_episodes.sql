-- 20260528020000 — Per-title "notify new episodes" flag
--
-- Until now the new-episode cron notified every title with status='watching'.
-- We move to an explicit per-title flag so users can:
--   - get notified about an airing show as soon as they add it (set on add), and
--   - turn notifications on/off per title from the detail page,
-- independently of the watch status.
--
-- Backfill: keep current behaviour by enabling the flag for every series/anime
-- the user is already watching, so nobody loses the alerts they had.

alter table public.media_items
  add column if not exists notify_episodes boolean not null default false;

update public.media_items
  set notify_episodes = true
  where status = 'watching'
    and kind in ('tv', 'anime');
