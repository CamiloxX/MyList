-- 20260608000000 — User-selectable featured badges
--
-- Lets each user pick which badges to showcase next to their name (in comment
-- threads, and later on a profile page). Stored as an ordered array of badge
-- ids on the profile. When empty, consumers fall back to the most recently
-- earned badges. The existing `profiles_update_own` RLS policy (auth.uid() = id)
-- already lets a user maintain this column; the app action additionally caps
-- the count and verifies the user actually earned each id.

alter table public.profiles
  add column if not exists featured_badge_ids text[] not null default '{}';
