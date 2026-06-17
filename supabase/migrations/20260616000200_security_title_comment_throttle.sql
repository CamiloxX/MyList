-- 20260616000200 — SECURITY: anti-flood throttle on title_comments
--
-- title_comments had only a body-length CHECK and a public-read policy, with no
-- frequency guard — unlike global chat (chat_throttle in 20260608010000). An
-- authenticated user could flood public comment threads as fast as they can call
-- the action (or insert directly via the RLS insert policy). Mirror the chat
-- pattern at the DB layer so a direct browser-client insert can't bypass it.

create or replace function public.title_comment_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.title_comments
    where user_id = new.user_id
      and created_at > now() - interval '3 seconds'
  ) then
    raise exception 'comment_throttled' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists title_comments_throttle on public.title_comments;
create trigger title_comments_throttle
  before insert on public.title_comments
  for each row execute function public.title_comment_throttle();
