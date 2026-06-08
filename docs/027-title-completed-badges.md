# 027 — Badges por título completo (incl. anime)

## Qué se hizo

Nuevo tipo de condición de desbloqueo: **`title_completed`**. Un badge se
desbloquea cuando el usuario marca un título concreto (película, serie **o
anime**) como **visto** (`media_items.status = 'watched'`), sin depender de
temporadas.

Esto resuelve el caso del anime de forma **automática**: a diferencia de
`title_season` (que solo funciona con series TMDB porque el anime no registra
`season_number`), `title_completed` se apoya en el estado "visto" del título,
que existe para todos los tipos. Así un badge tipo "completar este anime" se
desbloquea solo.

## Cómo funciona el match

- El picker (`title-picker.tsx`, con toggle **TMDB / Anime**) captura
  `source` + `sourceId` + `mediaKind` idénticos a los que guarda la biblioteca:
  - TMDB → `source='tmdb'`, `sourceId=String(tmdbId)`
  - Anime → `source='anilist'`, `sourceId=String(malId)` (Jikan; el enum
    `media_source` usa el nombre histórico `anilist`)
- El evaluador (`evaluator.ts`) arma `watchedTitles = Set<\`${source}:${sourceId}\`>`
  a partir de `media_items` con `status='watched'`. `progressFor` para
  `title_completed` compara `\`${source}:${sourceId}\`` contra ese set.
- Marcar un título como visto (`updateLibraryStatus`) ya llama
  `evaluateAndPersist`, así que el desbloqueo + push + overlay ocurren al instante.

El `criterion` guarda además un `title?` (solo para mostrar el nombre del título
en el panel y el resumen, sin fetch extra al editar). El evaluador lo ignora.

## Archivos

- `badges/types.ts` — variante `title_completed` + `BadgeStats.watchedTitles`.
- `badges/evaluator.ts` — query `media_items` ahora trae `source, source_id`;
  set `watchedTitles`; `titleKey` helper; caso en `progressFor`.
- `admin/schemas.ts` — `title_completed` en `badgeCriterionSchema`.
- `admin/actions.ts` — `searchTitlesForBadge(query, type)` (TMDB + Jikan).
- `admin/components/title-picker.tsx` (nuevo) + `condition-fields.tsx` (opción +
  render + default + `hasTarget` lo excluye) + `badge-admin-card.tsx` (resumen).
- `i18n/messages/{es,en}.json` — claves nuevas.

## Verificación

Revisión adversarial (workflow): confirmó el match end-to-end para TMDB **y
anime** (las keys coinciden, `watchedTitles` solo cuenta `status='watched'`, el
switch sigue exhaustivo, marcar visto dispara la evaluación). Único hallazgo: un
comentario desactualizado en el schema (corregido). `pnpm typecheck` ✅,
`pnpm build` ✅, lint ✅, JSON i18n válido (es+en).
