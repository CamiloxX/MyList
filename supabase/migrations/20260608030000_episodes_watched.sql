-- Per-anime episode progress. One row per anime already exists in media_items,
-- so a single counter column is enough (no new table). episode_count holds the
-- total; the action clamps episodes_watched to it (episode_count may be NULL for
-- anime with unknown totals, so we don't add a cross-column CHECK).
alter table public.media_items
  add column if not exists episodes_watched integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_items_episodes_watched_nonneg'
  ) then
    alter table public.media_items
      add constraint media_items_episodes_watched_nonneg check (episodes_watched >= 0);
  end if;
end $$;
-- No new RLS policy: media_items is already owner-scoped.
