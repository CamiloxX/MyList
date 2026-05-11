-- 001 — Initial schema for MyList
-- Tables: profiles, media_items, watch_entries, lists, list_items
-- All with Row Level Security enabled (owner-only by default).

-- ============================================================================
-- ENUM types
-- ============================================================================

create type public.media_kind as enum ('movie', 'tv', 'anime');
create type public.media_source as enum ('tmdb', 'anilist');
create type public.media_status as enum ('watching', 'watched', 'pending', 'dropped');
create type public.visibility_level as enum ('private', 'unlisted', 'public');

-- ============================================================================
-- profiles: extends auth.users with app-level fields
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- media_items: works (movies, series, anime) added to user library
-- ============================================================================

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source public.media_source not null,
  source_id text not null,
  kind public.media_kind not null,
  title text not null,
  original_title text,
  poster_url text,
  year integer,
  runtime_minutes integer,
  episode_count integer,
  genres jsonb not null default '[]'::jsonb,
  raw_metadata jsonb,
  status public.media_status not null default 'pending',
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, source_id, kind)
);

create index media_items_user_status_idx on public.media_items (user_id, status);
create index media_items_user_kind_idx on public.media_items (user_id, kind);

-- ============================================================================
-- watch_entries: each viewing of a media_item (allows re-watches)
-- ============================================================================

create table public.watch_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  watched_on date not null,
  rating smallint check (rating between 1 and 10),
  notes text,
  platform text,
  created_at timestamptz not null default now()
);

create index watch_entries_user_date_idx on public.watch_entries (user_id, watched_on desc);
create index watch_entries_media_idx on public.watch_entries (media_item_id);

-- ============================================================================
-- lists + list_items: custom user lists (e.g. "Mejores de 2026")
-- ============================================================================

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lists_user_idx on public.lists (user_id);

create table public.list_items (
  list_id uuid not null references public.lists(id) on delete cascade,
  media_item_id uuid not null references public.media_items(id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (list_id, media_item_id)
);

create index list_items_media_idx on public.list_items (media_item_id);

-- ============================================================================
-- Triggers: auto-update updated_at, auto-create profile on signup
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger media_items_updated_at
  before update on public.media_items
  for each row execute function public.set_updated_at();

create trigger lists_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

-- Auto-create profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.media_items enable row level security;
alter table public.watch_entries enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

-- profiles: owner can read and update their own row.
create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- media_items: owner-only.
create policy "media_items_select_own"
  on public.media_items for select using (auth.uid() = user_id);
create policy "media_items_insert_own"
  on public.media_items for insert with check (auth.uid() = user_id);
create policy "media_items_update_own"
  on public.media_items for update using (auth.uid() = user_id);
create policy "media_items_delete_own"
  on public.media_items for delete using (auth.uid() = user_id);

-- watch_entries: owner-only.
create policy "watch_entries_select_own"
  on public.watch_entries for select using (auth.uid() = user_id);
create policy "watch_entries_insert_own"
  on public.watch_entries for insert with check (auth.uid() = user_id);
create policy "watch_entries_update_own"
  on public.watch_entries for update using (auth.uid() = user_id);
create policy "watch_entries_delete_own"
  on public.watch_entries for delete using (auth.uid() = user_id);

-- lists: owner-only.
create policy "lists_select_own"
  on public.lists for select using (auth.uid() = user_id);
create policy "lists_insert_own"
  on public.lists for insert with check (auth.uid() = user_id);
create policy "lists_update_own"
  on public.lists for update using (auth.uid() = user_id);
create policy "lists_delete_own"
  on public.lists for delete using (auth.uid() = user_id);

-- list_items: visible/mutable if the parent list belongs to the current user.
create policy "list_items_select_via_list"
  on public.list_items for select using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );
create policy "list_items_insert_via_list"
  on public.list_items for insert with check (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );
create policy "list_items_update_via_list"
  on public.list_items for update using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );
create policy "list_items_delete_via_list"
  on public.list_items for delete using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
        and lists.user_id = auth.uid()
    )
  );
