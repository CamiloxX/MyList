-- Idempotent forum category seed. Slugs are stable identifiers; localized labels
-- live in src/i18n/messages/{es,en}.json under `forum.categories.<slug>`.

insert into public.forum_categories (slug, name, description, display_order) values
  ('general', 'General', 'Conversación general sobre lo que estás viendo.', 0),
  ('peliculas', 'Películas', 'Discusión sobre películas.', 1),
  ('series', 'Series', 'Discusión sobre series.', 2),
  ('anime', 'Anime', 'Discusión sobre anime.', 3),
  ('recomendaciones', 'Recomendaciones', 'Pide y comparte recomendaciones.', 4)
on conflict (slug) do nothing;
