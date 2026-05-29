-- 20260528010000 — Display name: prefill from Google + once-per-month change limit
--
-- Two changes:
-- 1. New signups via Google never carried a `display_name` claim (Google sends
--    `name` / `full_name`), so handle_new_user() fell back to the email prefix
--    and Google users ended up named like "camilokamikaze69". We now read those
--    claims before the fallback.
-- 2. Users may change their display name, but only once every 30 days. The limit
--    is enforced in the DB (not just in the server action) because the
--    `profiles_update_own` RLS policy lets a user update their own row directly
--    from the browser client, which would otherwise bypass the action.

-- ---------------------------------------------------------------------------
-- 1. Prefill display_name from the OAuth provider's name claims on signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Track the last change and enforce the 30-day limit.
-- ---------------------------------------------------------------------------
-- NULL means "never changed since signup" → the first change is free (it does
-- not consume the monthly quota, it just starts the clock).
alter table public.profiles
  add column if not exists display_name_updated_at timestamptz;

create or replace function public.enforce_display_name_change_limit()
returns trigger
language plpgsql
as $$
begin
  -- Only act when display_name actually changes (avatar / locale updates are free).
  if new.display_name is distinct from old.display_name then
    if old.display_name_updated_at is not null
       and now() - old.display_name_updated_at < interval '30 days' then
      raise exception 'display_name_change_too_soon'
        using errcode = 'check_violation';
    end if;
    new.display_name_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_display_name_change_limit on public.profiles;
create trigger profiles_display_name_change_limit
  before update on public.profiles
  for each row execute function public.enforce_display_name_change_limit();
