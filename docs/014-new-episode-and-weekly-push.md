# 014 — Push: avisos de episodio nuevo + resumen semanal

Cierra los 2 pasos que faltaban del plan de notificaciones (ver `013`). Reusa
toda la infra ya montada: `sendPushToUserAdmin`, el cliente service-role, el
guard de `CRON_SECRET` y pg_cron en Supabase.

## Qué se hizo

### Infra compartida

- **`src/features/notifications/cron-auth.ts`** — `withCronAuth(work)`: extrae el
  guard que tenía inline la ruta de notificaciones programadas (503 si no hay
  `CRON_SECRET`, 401 si el `Authorization: Bearer` no cuadra) y lo envuelve sobre
  cualquier función de trabajo. Ahora lo usan las 3 rutas de cron. GET y POST
  (pg_net hace POST, Vercel Cron haría GET).
- **i18n**: nuevo namespace top-level `push.*` en `es.json` y `en.json`
  (`push.weekly.*`, `push.episode.*`). Los textos se generan **en el idioma de
  cada usuario** (`profiles.locale`) con `createTranslator` de next-intl — no
  `getTranslations`, porque en un cron no hay contexto de request; createTranslator
  recibe locale + mensajes explícitos y es síncrono.

### A) Resumen semanal — `weekly-summary.ts` + `/api/cron/weekly-summary`

`dispatchWeeklySummary()`:
- Saca los usuarios con al menos una `push_subscription`.
- En **3 queries bulk** (no 3×N) cuenta de los últimos 7 días: visionados
  (`watch_entries.watched_on`), títulos nuevos (`media_items.created_at`) y logros
  (`user_badges.earned_at`); tally por usuario en JS.
- Si la semana fue 0/0/0 para un usuario → **no se le envía** (nada de "no viste
  nada"). Al resto: push con `tag: weekly-summary`, toca → `/stats`.

### B) Episodio nuevo — `new-episodes.ts` + `/api/cron/new-episodes`

`dispatchNewEpisodes()`:
- Recorre `media_items` con `status='watching'` y `kind in (tv, anime)` de los
  usuarios con push.
- **Agrupa por show** (`kind:source:source_id`) para pegarle a cada fuente
  externa una sola vez por corrida.
- **TV (TMDB)**: nuevo `getTmdbTvLastEpisode()` en `src/lib/tmdb/tv.ts` lee
  `last_episode_to_air`. Dispara si `air_date == hoy` (fecha en `America/Santiago`).
  Incluye temporada/episodio (`T2E5` / `S2E5` según idioma) y nombre del episodio
  si lo hay.
- **Anime (Jikan/MAL)**: nuevo `getJikanAiring()` en `src/lib/jikan/airing.ts` lee
  `status`/`airing` + `broadcast.day`. MAL no da fecha exacta, solo un día de la
  semana recurrente **en JST**, así que dispara si el anime está emitiendo y hoy
  (en `Asia/Tokyo`) es su día de broadcast. Sin número de episodio.
- Notifica a cada usuario que sigue el show, en su idioma. `tag:
  episode:<kind>:<sourceId>` (una notificación reemplaza a la anterior en
  pantalla), toca → `/library/[id]` del item de ESE usuario.

## Decisiones y límites (v1)

- **Sin tabla de estado de "ya notificado"**: la ventana "se emitió hoy" + la
  corrida 1×/día hacen que cada episodio dispare como mucho una vez. Coste: si un
  día falla el cron, ese aviso se pierde. Si en el futuro queremos ventana de
  varios días o reintentos, añadir tabla `notified_episodes(media_item_id, air_date)`
  con unique.
- **Zona horaria fija en el schedule** (pg_cron corre en UTC, no ajusta DST).
  Calibrado con Chile en horario de invierno (UTC-4). En verano (sept–abr, UTC-3)
  los avisos llegan 1h más tarde de lo nominal. Aceptable para notificaciones.
- **Anime por día de emisión, no por episodio concreto** (limitación de MAL).

## Setup pendiente (manual, una sola vez): programar los 2 jobs pg_cron

`CRON_SECRET` ya está en Vercel y en pg_cron para la ruta de programadas; estas
rutas usan el **mismo** secreto. Solo hay que crear 2 jobs nuevos. En el SQL
Editor de Supabase (o vía Management API), con el dominio y el secreto reales:

```sql
-- Resumen semanal: domingos 20:00 Chile (UTC-4) = lunes 00:00 UTC
select cron.schedule(
  'weekly-summary',
  '0 0 * * 1',
  $cron$
  select net.http_post(
    url     := 'https://my-list-henna.vercel.app/api/cron/weekly-summary',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer <CRON_SECRET>')
  );
  $cron$
);

-- Episodio nuevo: diario 10:00 Chile (UTC-4) = 14:00 UTC
select cron.schedule(
  'new-episodes',
  '0 14 * * *',
  $cron$
  select net.http_post(
    url     := 'https://my-list-henna.vercel.app/api/cron/new-episodes',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer <CRON_SECRET>')
  );
  $cron$
);
```

## Probar

- Forzar a mano (devuelve el resumen JSON sin esperar al cron):
  `GET /api/cron/weekly-summary` y `/api/cron/new-episodes` con
  `Authorization: Bearer <CRON_SECRET>`.
- Episodio TV: tener una serie en *viendo* cuyo último episodio en TMDB tenga
  `air_date` = hoy.
- Resumen: registrar algún visionado/título/logro en los últimos 7 días.
