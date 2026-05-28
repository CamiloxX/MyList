-- Scheduled push notifications.
-- An admin queues a notification for a future moment; a cron job (Supabase
-- pg_cron hitting /api/cron/notifications, or Vercel Cron on Pro) picks up the
-- due rows and dispatches them via web-push, then stamps sent_at + result.
--
-- target_user_id NULL  => broadcast to every subscribed device
-- target_user_id set   => only that user's devices (handy for testing a
--                         schedule without spamming everyone)

create table public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  target_user_id uuid references auth.users(id) on delete cascade,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  -- {sent, failed, pruned} written by the dispatcher after a successful run.
  result jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- The dispatcher's hot path: "give me unsent rows whose time has come".
-- Partial index keeps it tiny — sent rows fall out of the index entirely.
create index scheduled_notifications_due_idx
  on public.scheduled_notifications (scheduled_for)
  where sent_at is null;

alter table public.scheduled_notifications enable row level security;

-- Admin-only on every verb. The dispatcher runs with the service-role key and
-- bypasses RLS, so it never needs a policy. We gate on profiles.is_admin; the
-- subquery is allowed because profiles_select_own lets a user read their own row.
create policy "scheduled_notifications_admin_select"
  on public.scheduled_notifications for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "scheduled_notifications_admin_insert"
  on public.scheduled_notifications for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "scheduled_notifications_admin_update"
  on public.scheduled_notifications for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "scheduled_notifications_admin_delete"
  on public.scheduled_notifications for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
