# 030 — Tracking de episodios de anime

Contador de episodios vistos por anime, con barra de progreso, auto-marcado como
visto al llegar al total, y un criterio de badge nuevo por llegar a N episodios.

## Por qué (no temporadas)
El anime no encaja en el modelo de temporadas de TMDB: en MyAnimeList cada
temporada es una **entrada separada** (Attack on Titan, AoT S2, S3…), cada una
con su `mal_id`, y Jikan no expone un número de temporada (su campo `season` es
texto tipo `"fall 2013"`). Así que `title_season` no sirve para anime. El modelo
nativo del anime es **episodios**: se trackean por episodio, no por temporada.

## Datos
- **Migración** `20260608030000_episodes_watched.sql`: `media_items.episodes_watched
  integer not null default 0` + CHECK `>= 0`. El total vive en `episode_count`
  (nullable); el clamp a `[0, total]` se hace en la **action** (un CHECK
  cross-column rechazaría anime sin total). Sin RLS nueva (owner-scoped).

## Action
`setEpisodesWatched({ mediaItemId, count })` en `library/actions.ts` (espejo de
`markSeasonWatched`): **anime-only** (rechaza otros kinds), clampa a `[0, total]`,
auto-gestiona el status (`0 → pending`, `total → watched`, resto `watching`) **sin
pisar un `dropped` manual**, y al completar inserta **exactamente un**
`watch_entry` (si no existía) para que el anime aparezca una vez en stats/`/month`
(que cuentan `watch_entries`). Al **decrementar** bajo el total el entry de
completado **se queda** (sí lo vio; borrarlo corromper­ía la racha). El cliente
manda el valor absoluto (sin acciones increment/decrement separadas).

## UI
`EpisodeTracker` (`library/components/episode-tracker.tsx`, optimista como
`SeasonToggle`): "X / total" + barra, botones −/+, "marcar completo"; si el total
es desconocido (`episode_count` null) cae a un input numérico libre. Montado en
`library/[id]/page.tsx` junto a la rama de TV, para `kind === "anime"`.

## Badges
- `title_completed` (ya existente) ahora cubre anime automáticamente: al llegar
  al total → status `watched` → entra en `watchedTitles` → desbloquea.
- **Nuevo criterio `title_episodes`** `{ source:"anilist", sourceId, episodes }`:
  "vio ≥ N episodios de este anime". `evaluator.loadStats` arma un Map
  `source:sourceId → episodes_watched` (anime only); `progressFor` compara contra
  `episodes`. Admin: nuevo `AnimeEpisodesPicker` (búsqueda anime + input de
  episodios) en `condition-fields`; schema en `admin/schemas.ts`; resumen en
  `badge-admin-card`. i18n `admin.condition.{titleEpisodesHint,searchAnime,
  episodes}`, `admin.condition.kinds.title_episodes`, `admin.summary.titleEpisodes`.
- Contador global de episodios: diferido (redundante con `watch_entries_count`).

## Verificación
`pnpm typecheck` (el switch de `progressFor` sin `default` obliga a cubrir el
nuevo case) · `pnpm build` · `pnpm test` · lint. Manual: anime con total 12 → + a
11 (watching, ~92%) → completar (watched, **1** watch_entry, aparece en /stats y
/month); decrementar deja el entry; anime con total desconocido → input libre;
admin: crear badge `title_episodes` y verificar resumen + edición.

## Pendiente
Season-tracking real de anime (numerar temporadas vía relaciones Jikan) sigue
fuera de alcance — frágil. El perfil público es independiente (ver `docs/029`).
