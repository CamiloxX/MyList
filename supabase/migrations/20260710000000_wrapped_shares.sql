-- Share-by-link for the annual Wrapped. The random uuid acts as the
-- capability: anyone with the link can view via the service-role path,
-- and revoking = deleting the row. No anonymous RLS policy on purpose.
create table public.wrapped_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null check (year between 1900 and 2200),
  created_at timestamptz not null default now(),
  unique (user_id, year)
);

alter table public.wrapped_shares enable row level security;

-- Owner-only access; public reads go through the service-role client gated
-- by row existence (same pattern as shared lists).
create policy wrapped_shares_select_own on public.wrapped_shares
  for select using ((select auth.uid()) = user_id);

create policy wrapped_shares_insert_own on public.wrapped_shares
  for insert with check ((select auth.uid()) = user_id);

create policy wrapped_shares_delete_own on public.wrapped_shares
  for delete using ((select auth.uid()) = user_id);
