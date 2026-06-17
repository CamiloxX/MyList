-- 20260616000300 — SECURITY: featured_badge_ids must reference earned badges
--
-- profiles.featured_badge_ids (20260608000000) is writable through the owner's
-- profiles_update_own policy, so a tampered browser client could feature badges
-- the user never earned, bypassing the earned-only filter in
-- updateFeaturedBadges (badges/actions.ts). Enforce the rule at the DB layer:
-- every featured id must exist in the user's user_badges. Legitimate writes
-- (already filtered to earned) pass unchanged; only tampering is rejected.

create or replace function public.enforce_featured_badges_earned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.featured_badge_ids is distinct from old.featured_badge_ids then
    if exists (
      select 1
      from unnest(new.featured_badge_ids) fid
      where not exists (
        select 1 from public.user_badges ub
        where ub.user_id = new.id and ub.badge_id = fid
      )
    ) then
      raise exception 'featured_badge_ids must reference earned badges'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_featured_badges_earned on public.profiles;
create trigger profiles_featured_badges_earned
  before update on public.profiles
  for each row execute function public.enforce_featured_badges_earned();
