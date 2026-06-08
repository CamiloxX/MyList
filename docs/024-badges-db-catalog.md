# 024 — El catálogo de badges pasa de código a base de datos

## Qué se hizo

El catálogo de logros vivía en código (`src/features/badges/catalog.ts`, un array
estático de 15 badges). Se movió a una tabla real `public.badges` para poder, a
futuro, crear badges personalizadas desde un panel de admin (con imagen propia y
condiciones de desbloqueo nuevas). Esta es la **Fase 1** de esa feature: solo
cimientos; el comportamiento visible no cambia.

### Base de datos (`supabase/migrations/20260607000000_badges_catalog.sql`)

- Tabla `badges`: `id`, `name`, `description`, `i18n_key`, `icon_key`,
  `icon_url`, `tier`, `criterion` (jsonb), `sort_order`, `is_active`, timestamps.
- RLS: lectura pública de las activas (los admin también ven las inactivas);
  escritura solo para admins vía `public.is_admin(auth.uid())`.
- FK `user_badges.badge_id → badges.id` con `on delete cascade`. **El seed debe
  ejecutarse antes del `ALTER ... ADD CONSTRAINT`**, porque el FK valida las filas
  existentes de `user_badges` en el momento de crearse (las 15 ids sembradas
  cubren los ids que ya tenían usuarios).
- Políticas admin en `user_badges` (insert/delete) para poder otorgar badges a
  mano más adelante.
- Bucket público `badge-icons` (escritura solo admin) para las imágenes subidas.
  Mismo patrón de "listing" que `avatars`/`list-covers` (advisor WARN aceptado:
  el arte de badges es público).
- Seed de las 15 badges existentes, idénticas al array anterior.

### `criterion` (jsonb) refleja el union `BadgeCriterion` de TS

Además de los contadores existentes se añadieron dos variantes (inertes hasta la
Fase 3, pero ya soportadas por el evaluador):

- `title_season`: se desbloquea al marcar vista una temporada concreta de un
  título concreto (`source` + `sourceId` + `season`). Es el caso "ver la T1 de un
  anime → badge".
- `manual`: nunca se auto-otorga; un admin la concede a mano.

### Código

- `types.ts`: union de criterios ampliado; `BadgeDefinition` ahora lleva el texto
  ya resuelto (`name`/`description`) + `iconKey`/`iconUrl`; `BadgeStats` incluye
  el set de `(título, temporada)` vistos.
- `catalog.ts`: pasa a ser **server-only**; expone `loadBadgeCatalog`/
  `loadBadgeMap` que leen de la BD y resuelven el texto (next-intl para
  built-ins con `i18n_key`, columnas de la BD para las custom).
- `evaluator.ts`: carga el catálogo desde la BD, calcula `watchedTitleSeasons`
  con un join `watch_entries → media_items`, y evalúa los criterios nuevos.
- `queries.ts`, `push-notify.ts`, `badge-icon.tsx` (soporta imagen subida y se
  añadieron los íconos Lucide que faltaban), `badge-card`, `badge-unlock-overlay`,
  `author-aside`, `title-comments` y `settings`: todos consumen el badge con su
  texto/ícono ya resuelto en vez de resolver por `i18nKey` en el componente.

## Por qué

Para que un admin pueda "subir un logo y que se desbloquee solo", el catálogo
tiene que ser dato, no código. Resolver el texto en la capa de datos (servidor)
desacopla los componentes del `i18nKey` y permite que las badges custom (sin
clave de traducción) usen su texto de la BD sin romper la regla de "nada de
español hardcodeado en componentes" (es contenido, no chrome).

## Verificación

- `pnpm typecheck` ✅, `pnpm build` (webpack) ✅.
- Migración aplicada vía MCP de Supabase: 15 filas sembradas, FK creado, bucket
  público, 4 políticas en `badges`, 4 en storage, 2 admin en `user_badges`.

## Pendiente (siguientes fases)

- **Fase 2**: panel `/admin` (gateado por `is_admin`) + CRUD de badges con subida
  de imagen y selector de condición (título+temporada / manual).
- **Fase 3**: cerrar el desbloqueo automático por título+temporada (ya hay motor)
  y la herramienta de "otorgar a mano" a un usuario.
