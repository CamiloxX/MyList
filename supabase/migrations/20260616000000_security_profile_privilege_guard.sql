-- 20260616000000 — SECURITY: block privilege escalation via profiles UPDATE
--
-- Critical fix. The original `profiles_update_own` policy (001) had no WITH CHECK
-- and no column restriction, so a user could update ANY column of their own row —
-- including `is_admin` (added in 004) — straight from the browser anon client:
--   supabase.from('profiles').update({ is_admin: true }).eq('id', '<own-uuid>')
-- That single write defeated every requireAdmin() server-action gate and every
-- is_admin(auth.uid()) RLS policy (badges, scheduled push, chat moderation,
-- comment deletion, official lists).
--
-- Fix mirrors the existing guard_list_official() trigger (20260609000000): only an
-- existing admin may flip is_admin; the service-role client (auth.uid() is null)
-- is allowed through for dashboard/admin operations. We also re-declare the UPDATE
-- policy with an explicit WITH CHECK as defense-in-depth.

create or replace function public.guard_profile_privileged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only an already-admin (or the service-role client) may change is_admin.
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can change is_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged();

-- Defense-in-depth: an UPDATE can only target the caller's own row, and the new
-- row must still belong to the caller (prevents moving a row to another id).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
