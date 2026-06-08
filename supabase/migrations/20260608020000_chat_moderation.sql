-- 20260608020000 — Chat moderation: mute (read-only) and ban (no chat).
-- Admins restrict a user in the global room. RLS on chat_messages enforces it
-- server-side; the client distinguishes mute vs ban only for UX.

create table public.chat_restrictions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  type text not null check (type in ('mute', 'ban')),
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.chat_restrictions enable row level security;

-- A user can read their own restriction (to render the muted/banned notice);
-- admins read and manage everyone's.
create policy "chat_restr_select_self_or_admin"
  on public.chat_restrictions for select using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );
create policy "chat_restr_admin_insert"
  on public.chat_restrictions for insert with check (public.is_admin(auth.uid()));
create policy "chat_restr_admin_update"
  on public.chat_restrictions for update using (public.is_admin(auth.uid()));
create policy "chat_restr_admin_delete"
  on public.chat_restrictions for delete using (public.is_admin(auth.uid()));

-- True when the user has an active (non-expired) mute or ban.
create or replace function public.is_chat_restricted(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_restrictions r
    where r.user_id = uid
      and (r.expires_at is null or r.expires_at > now())
  );
$$;

-- Tighten the insert policy so restricted users can't post (they can still read).
drop policy "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own"
  on public.chat_messages for insert with check (
    auth.uid() = user_id and not public.is_chat_restricted(auth.uid())
  );

-- Realtime: let each user receive their own restriction changes live so a ban
-- hides the bubble (and an unban brings it back) without a reload.
alter publication supabase_realtime add table public.chat_restrictions;
