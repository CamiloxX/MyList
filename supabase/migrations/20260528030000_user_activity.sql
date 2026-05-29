-- 20260528030000 — Daily activity log for the "usage" streak
--
-- Records one row per (user, day) when the user opens the app, so the stats
-- streak can count days the user showed up — not only days they logged a view.
-- The streak becomes the union of watch_entries dates and these visit dates.

create table public.user_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  active_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, active_on)
);

alter table public.user_activity enable row level security;

create policy "user_activity_select_own"
  on public.user_activity for select using (auth.uid() = user_id);
create policy "user_activity_insert_own"
  on public.user_activity for insert with check (auth.uid() = user_id);
