-- 006 — Drop the forum feature.
-- The forum (categories/threads/posts/reactions) was retired. We keep:
--   - title_comments (per-title comments, still in use)
--   - profiles.is_admin column + public.is_admin(uuid) helper (used by
--     title_comments policies and admin UX)

drop table if exists public.forum_reactions cascade;
drop table if exists public.forum_posts cascade;
drop table if exists public.forum_threads cascade;
drop table if exists public.forum_categories cascade;

-- Trigger function bumped reply_count on the parent thread; no other table
-- references it once forum_posts is gone.
drop function if exists public.bump_thread_on_post() cascade;
