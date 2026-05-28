-- Web Push subscriptions
-- One row per (device, browser) that has opted in. The endpoint is globally
-- unique per push service, so we key on it: re-subscribing on the same device
-- after a refresh just overwrites the existing row.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete using (auth.uid() = user_id);
