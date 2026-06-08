-- 20260607000000 — Badges catalog moves from code to the database
--
-- Until now the badge catalog lived in code (src/features/badges/catalog.ts).
-- To let admins create custom badges (with uploaded icons and title-based
-- unlock rules) the catalog becomes a real table. `user_badges` keeps storing
-- which badges each user unlocked; its badge_id now references badges.id.
--
-- Display text: built-in badges keep an `i18n_key` so the UI can resolve the
-- localized string from next-intl; `name`/`description` hold a Spanish fallback
-- (and are the canonical text for admin-created badges, which have no i18n_key).
--
-- `criterion` is a JSON blob mirroring the BadgeCriterion union in TypeScript:
--   { "kind": "watch_entries_count", "target": 1 }
--   { "kind": "media_completed_count", "mediaKind": "movie", "target": 10 }
--   { "kind": "ratings_count" | "unique_genres_count" | "unique_decades_count"
--           | "same_day_entries" | "daily_streak", "target": N }
--   { "kind": "title_season", "source": "tmdb", "sourceId": "1429",
--           "mediaKind": "anime", "season": 1 }     -- unlocked by watching that season
--   { "kind": "manual" }                            -- granted by an admin by hand

-- ============================================================================
-- badges: the catalog itself
-- ============================================================================

create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  i18n_key text,
  icon_key text,
  icon_url text,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  criterion jsonb not null default '{"kind":"manual"}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index badges_active_sort_idx on public.badges (is_active, sort_order);

alter table public.badges enable row level security;

-- Everyone (incl. anon, for public author badge chips) can read active badges.
-- Admins additionally see inactive ones so they can manage them.
create policy "badges_select_active_or_admin"
  on public.badges for select
  using (is_active or public.is_admin(auth.uid()));

-- Only admins can create / edit / delete badges.
create policy "badges_admin_insert"
  on public.badges for insert
  with check (public.is_admin(auth.uid()));
create policy "badges_admin_update"
  on public.badges for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
create policy "badges_admin_delete"
  on public.badges for delete
  using (public.is_admin(auth.uid()));

-- ============================================================================
-- Seed the 15 built-in badges (verbatim from the old code catalog).
-- Must run BEFORE the FK below so existing user_badges rows validate against it.
-- ============================================================================

insert into public.badges (id, name, description, i18n_key, icon_key, tier, criterion, sort_order) values
  ('first_watch', 'Primera función', 'Registra tu primera visualización.', 'first_watch', 'Sparkles', 'bronze', '{"kind":"watch_entries_count","target":1}', 10),
  ('cinephile_10', 'Cinéfilo', 'Marca como vistas 10 películas.', 'cinephile_10', 'Film', 'bronze', '{"kind":"media_completed_count","mediaKind":"movie","target":10}', 20),
  ('series_finisher_5', 'Maratonero de series', 'Termina 5 series.', 'series_finisher_5', 'Tv', 'silver', '{"kind":"media_completed_count","mediaKind":"tv","target":5}', 30),
  ('otaku_5', 'Otaku', 'Termina 5 animes.', 'otaku_5', 'Sword', 'silver', '{"kind":"media_completed_count","mediaKind":"anime","target":5}', 40),
  ('critic_20', 'Crítico', 'Califica 20 visualizaciones.', 'critic_20', 'Star', 'bronze', '{"kind":"ratings_count","target":20}', 50),
  ('marathon_3', 'Maratón', 'Registra 3 visualizaciones en un mismo día.', 'marathon_3', 'Zap', 'silver', '{"kind":"same_day_entries","target":3}', 60),
  ('genre_explorer_5', 'Explorador de géneros', 'Mira contenido de 5 géneros distintos.', 'genre_explorer_5', 'Compass', 'silver', '{"kind":"unique_genres_count","target":5}', 70),
  ('streak_7', 'En racha', 'Registra al menos una visualización 7 días seguidos.', 'streak_7', 'Flame', 'gold', '{"kind":"daily_streak","target":7}', 80),
  ('cinephile_50', 'Cinéfilo empedernido', 'Marca como vistas 50 películas.', 'cinephile_50', 'Clapperboard', 'gold', '{"kind":"media_completed_count","mediaKind":"movie","target":50}', 90),
  ('series_finisher_20', 'Devorador de series', 'Termina 20 series.', 'series_finisher_20', 'MonitorPlay', 'gold', '{"kind":"media_completed_count","mediaKind":"tv","target":20}', 100),
  ('otaku_20', 'Maestro Otaku', 'Termina 20 animes.', 'otaku_20', 'Swords', 'gold', '{"kind":"media_completed_count","mediaKind":"anime","target":20}', 110),
  ('critic_50', 'Crítico experto', 'Califica 50 visualizaciones.', 'critic_50', 'Award', 'silver', '{"kind":"ratings_count","target":50}', 120),
  ('marathon_5', 'Sin dormir', 'Registra 5 visualizaciones en un mismo día.', 'marathon_5', 'BatteryWarning', 'gold', '{"kind":"same_day_entries","target":5}', 130),
  ('streak_30', 'Imparable', 'Registra al menos una visualización 30 días seguidos.', 'streak_30', 'Trophy', 'gold', '{"kind":"daily_streak","target":30}', 140),
  ('decade_explorer_4', 'Viajero en el tiempo', 'Mira contenido de 4 décadas distintas.', 'decade_explorer_4', 'Hourglass', 'silver', '{"kind":"unique_decades_count","target":4}', 150);

-- ============================================================================
-- user_badges: link to the catalog + let admins grant badges by hand
-- ============================================================================

-- Cascade so a deleted badge also disappears from everyone's unlocked list.
alter table public.user_badges
  add constraint user_badges_badge_id_fkey
  foreign key (badge_id) references public.badges(id) on delete cascade;

-- Admins can grant (and revoke) any badge to any user from the admin panel.
create policy "user_badges_admin_insert"
  on public.user_badges for insert
  with check (public.is_admin(auth.uid()));
create policy "user_badges_admin_delete"
  on public.user_badges for delete
  using (public.is_admin(auth.uid()));

-- ============================================================================
-- badge-icons storage bucket (admin-writable, world-readable)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('badge-icons', 'badge-icons', true)
on conflict (id) do update set public = true;

create policy "badge_icons_read_public"
  on storage.objects for select
  using (bucket_id = 'badge-icons');

create policy "badge_icons_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'badge-icons' and public.is_admin(auth.uid()));
create policy "badge_icons_admin_update"
  on storage.objects for update
  using (bucket_id = 'badge-icons' and public.is_admin(auth.uid()));
create policy "badge_icons_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'badge-icons' and public.is_admin(auth.uid()));
