-- 20260616000100 — SECURITY: resolve_authors() RPC for cross-user author cards
--
-- Part A of closing the broad profiles read leak. Migration 007 opened
-- `profiles_select_authenticated using (true)`, which let any logged-in user
-- SELECT every column of every profile — including `username` and `is_public`
-- (added in 20260608020000), defeating the opt-in /u/<username> design, plus
-- is_admin and featured_badge_ids of all users.
--
-- The only legitimate cross-user reads are author cards (chat, comments): they
-- need display_name, avatar_url, is_admin and featured_badge_ids — never username
-- or is_public. This SECURITY DEFINER function returns exactly those fields for a
-- given set of ids (no enumeration: it requires the caller to already hold the
-- uuids), so we can drop the blanket policy (Part B) without breaking author
-- resolution. Owner self-reads keep working via the unchanged profiles_select_own.

create or replace function public.resolve_authors(ids uuid[])
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  is_admin boolean,
  featured_badge_ids text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url, p.is_admin, p.featured_badge_ids
  from public.profiles p
  where p.id = any(ids);
$$;

revoke all on function public.resolve_authors(uuid[]) from public;
grant execute on function public.resolve_authors(uuid[]) to authenticated, service_role;
