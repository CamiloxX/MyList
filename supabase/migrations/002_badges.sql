-- 002 — Badges (achievements) system
-- Persists which badges each user has unlocked. The catalog of badges itself
-- lives in code (src/features/badges/catalog.ts) so badge_id is plain text.

create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index user_badges_user_idx on public.user_badges (user_id);
create index user_badges_user_earned_idx on public.user_badges (user_id, earned_at desc);

alter table public.user_badges enable row level security;

create policy "user_badges_select_own"
  on public.user_badges for select using (auth.uid() = user_id);
create policy "user_badges_insert_own"
  on public.user_badges for insert with check (auth.uid() = user_id);
create policy "user_badges_delete_own"
  on public.user_badges for delete using (auth.uid() = user_id);
