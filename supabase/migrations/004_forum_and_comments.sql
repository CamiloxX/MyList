-- 004 — Forum (categories/threads/posts/reactions) + per-title comments + admin role
-- Public read access (anyone can read; only authenticated users can write).
-- Moderation is gated by profiles.is_admin via the public.is_admin(uuid) helper.

-- ============================================================================
-- Admin role flag on profiles
-- ============================================================================

alter table public.profiles
  add column is_admin boolean not null default false;

-- Helper used in policies to avoid joining profiles on every check.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- ============================================================================
-- forum_categories: admin-managed list of top-level sections
-- ============================================================================

create table public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index forum_categories_order_idx on public.forum_categories (display_order, slug);

-- ============================================================================
-- forum_threads
-- ============================================================================

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  pinned boolean not null default false,
  locked boolean not null default false,
  reply_count integer not null default 0,
  last_post_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_threads_category_idx
  on public.forum_threads (category_id, pinned desc, last_post_at desc);
create index forum_threads_user_idx on public.forum_threads (user_id);

create trigger forum_threads_updated_at
  before update on public.forum_threads
  for each row execute function public.set_updated_at();

-- ============================================================================
-- forum_posts
-- ============================================================================

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  body_md text not null check (char_length(body_md) between 1 and 10000),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index forum_posts_thread_idx on public.forum_posts (thread_id, created_at);
create index forum_posts_user_idx on public.forum_posts (user_id);

-- Bump reply_count and last_post_at on the parent thread when a post is inserted.
create or replace function public.bump_thread_on_post()
returns trigger
language plpgsql
as $$
begin
  update public.forum_threads
  set reply_count = reply_count + 1,
      last_post_at = new.created_at,
      updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger forum_posts_bump_thread
  after insert on public.forum_posts
  for each row execute function public.bump_thread_on_post();

-- ============================================================================
-- forum_reactions: "like" is the only reaction kind (one row per post+user)
-- ============================================================================

create table public.forum_reactions (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index forum_reactions_user_idx on public.forum_reactions (user_id);

-- ============================================================================
-- title_comments: comments scoped to a GLOBAL title (source, source_id, kind)
-- — independent of any user's private media_items row, so two viewers see the
-- same conversation on the same title.
-- ============================================================================

create table public.title_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source public.media_source not null,
  source_id text not null,
  kind public.media_kind not null,
  body_md text not null check (char_length(body_md) between 1 and 4000),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index title_comments_title_idx
  on public.title_comments (source, source_id, kind, created_at desc);
create index title_comments_user_idx on public.title_comments (user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_reactions enable row level security;
alter table public.title_comments enable row level security;

-- Categories — public read, admin-only writes.
create policy "forum_cat_select_all"
  on public.forum_categories for select using (true);
create policy "forum_cat_admin_insert"
  on public.forum_categories for insert with check (public.is_admin(auth.uid()));
create policy "forum_cat_admin_update"
  on public.forum_categories for update using (public.is_admin(auth.uid()));
create policy "forum_cat_admin_delete"
  on public.forum_categories for delete using (public.is_admin(auth.uid()));

-- Threads — public read; authenticated owners can create; owner or admin can mutate.
create policy "forum_thr_select_all"
  on public.forum_threads for select using (true);
create policy "forum_thr_insert_own"
  on public.forum_threads for insert with check (auth.uid() = user_id);
create policy "forum_thr_update_owner_or_admin"
  on public.forum_threads for update using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );
create policy "forum_thr_delete_owner_or_admin"
  on public.forum_threads for delete using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );

-- Posts — public read; insert requires the parent thread to be unlocked
-- (admins bypass the lock). Update only by the author. Delete by author or admin.
create policy "forum_post_select_all"
  on public.forum_posts for select using (true);
create policy "forum_post_insert_own_unlocked"
  on public.forum_posts for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.forum_threads t
      where t.id = thread_id
        and (t.locked = false or public.is_admin(auth.uid()))
    )
  );
create policy "forum_post_update_owner"
  on public.forum_posts for update using (auth.uid() = user_id);
create policy "forum_post_delete_owner_or_admin"
  on public.forum_posts for delete using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );

-- Reactions — public read; only the user themselves can like/unlike.
create policy "forum_react_select_all"
  on public.forum_reactions for select using (true);
create policy "forum_react_insert_own"
  on public.forum_reactions for insert with check (auth.uid() = user_id);
create policy "forum_react_delete_own"
  on public.forum_reactions for delete using (auth.uid() = user_id);

-- Title comments — public read; authenticated owners write; owner edits; owner or admin deletes.
create policy "title_com_select_all"
  on public.title_comments for select using (true);
create policy "title_com_insert_own"
  on public.title_comments for insert with check (auth.uid() = user_id);
create policy "title_com_update_owner"
  on public.title_comments for update using (auth.uid() = user_id);
create policy "title_com_delete_owner_or_admin"
  on public.title_comments for delete using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );
