-- Public profile support: a chosen unique handle + an opt-in visibility flag.
-- citext gives case-insensitive uniqueness so "Pugcini" and "pugcini" collide.
create extension if not exists citext;

alter table public.profiles
  add column if not exists username citext,
  add column if not exists is_public boolean not null default false;

-- Partial unique index: existing rows have NULL username and must not collide.
create unique index if not exists profiles_username_key
  on public.profiles (username)
  where username is not null;

-- Format guard: 3-20 chars, lowercase letters/digits/underscore. Idempotent add.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9_]{3,20}$');
  end if;
end $$;

-- No new RLS policy: profiles_update_own already lets a user write their own
-- columns; the public profile page reads via the service-role client gated by
-- is_public in application code (mirrors the shared-lists pattern).
