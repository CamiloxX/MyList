-- 20260608010000 — Global chat: a single public room with persistent history.
-- One global conversation for everyone. The app sits behind login, so in
-- practice only authenticated users reach the bubble, but the SELECT policy is
-- public (mirrors title_com_select_all) so the room is readable without a
-- per-user scope. Realtime pushes new/removed messages to connected clients.

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index chat_messages_created_idx on public.chat_messages (created_at desc);
create index chat_messages_user_idx on public.chat_messages (user_id);

alter table public.chat_messages enable row level security;

-- Public read; authenticated owners write; owner edits; owner or admin deletes
-- (reuses the public.is_admin() helper from migration 004).
create policy "chat_select_all"
  on public.chat_messages for select using (true);
create policy "chat_insert_own"
  on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "chat_update_own"
  on public.chat_messages for update using (auth.uid() = user_id);
create policy "chat_delete_owner_or_admin"
  on public.chat_messages for delete using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );

-- Anti-flood: reject a message if the same user posted within the last 2s.
-- security definer + fixed search_path so the lookup bypasses RLS and can't be
-- shadowed by a malicious search_path.
create or replace function public.chat_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.chat_messages
    where user_id = new.user_id
      and created_at > now() - interval '2 seconds'
  ) then
    raise exception 'chat_throttled' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger chat_messages_throttle
  before insert on public.chat_messages
  for each row execute function public.chat_throttle();

-- Enable Realtime delivery for this table.
alter publication supabase_realtime add table public.chat_messages;
