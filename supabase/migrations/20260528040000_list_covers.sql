-- 20260528040000 — List cover images
--
-- Optional cover per list (uploaded by the owner). When null, the UI shows a
-- generated gradient default. Images live in a public `list-covers` bucket at
-- `list-covers/<user_id>/<list_id>.<ext>` — same owner-scoped pattern as avatars.

alter table public.lists
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('list-covers', 'list-covers', true)
on conflict (id) do update set public = true;

create policy "list_covers_read_public"
  on storage.objects for select
  using (bucket_id = 'list-covers');

create policy "list_covers_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'list-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "list_covers_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'list-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "list_covers_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'list-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
