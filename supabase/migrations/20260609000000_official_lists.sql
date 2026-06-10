-- Official lists: curated lists an admin publishes so they show up for everyone
-- (in Discover) with a verified badge. is_official may only be toggled by an
-- admin — a trigger guards the column so a normal owner can't promote their own
-- list straight through the public API.

alter table public.lists
  add column is_official boolean not null default false;

-- "Official, newest first" scans for the Discover feed.
create index lists_official_idx on public.lists (created_at desc) where is_official;

-- Anyone may read an official list (the owner-only select policy stays for the
-- rest). This lets official lists surface in Discover and on their share page.
create policy "lists_select_official"
  on public.lists for select
  using (is_official);

-- Guard: only admins may set/clear is_official. The service-role client (used by
-- the admin server action) has auth.uid() = null, so it is allowed through;
-- a logged-in non-admin trying to flip the flag is rejected.
create or replace function public.guard_list_official()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_official
       and auth.uid() is not null
       and not public.is_admin(auth.uid()) then
      raise exception 'Only admins can mark a list official';
    end if;
  elsif new.is_official is distinct from old.is_official then
    if auth.uid() is not null and not public.is_admin(auth.uid()) then
      raise exception 'Only admins can change a list''s official status';
    end if;
  end if;
  return new;
end;
$$;

create trigger lists_guard_official
  before insert or update on public.lists
  for each row execute function public.guard_list_official();
