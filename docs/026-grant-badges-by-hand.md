# 026 — Otorgar badges a mano (Fase 3)

## Qué se hizo

Cierre del sistema de badges custom: una herramienta en `/admin` para **otorgar
o quitar logros a un usuario directamente**, sin condición automática. Resuelve
el caso del anime (que no auto-desbloquea por temporada, ver
[025](025-admin-badges-panel.md)) y cualquier asignación manual.

### Server actions (`src/features/admin/actions.ts`)

- `searchUsersForGrant(query)` — busca perfiles por `display_name` (ilike,
  límite 8). RLS: `profiles` tiene SELECT abierto a `authenticated` (migración
  007).
- `getGrantedBadgeIds(userId)` — ids que el usuario ya tiene.
- `grantBadge(userId, badgeId)` — inserta en `user_badges`; **idempotente**
  (un `23505` se trata como éxito sin push). En un grant nuevo dispara
  `pushNewBadges` (misma notificación que el desbloqueo automático).
- `revokeBadge(userId, badgeId)` — borra la fila.

Todas re-verifican `requireAdmin()` y validan `userId` (uuid) y `badgeId`. Las
políticas RLS admin INSERT/DELETE de `user_badges` (migración de Fase 1) son la
autoridad real.

### UI (`grant-badges-panel.tsx`)

Buscador de usuario → al seleccionar uno se cargan sus badges otorgados; lista
de todos los logros con un botón **Otorgar / Quitar** por fila (toggle
optimista, revierte en fallo). Sección añadida a `admin/page.tsx` bajo el CRUD.

i18n: namespace `admin.grant.*` en es + en.

## Revisión adversarial (workflow) — 4 hallazgos corregidos

1. **Race de cierre obsoleto (medium-high)**: si el admin cambiaba de usuario
   mientras una mutación estaba en vuelo y esta fallaba, el revert pisaba el
   checklist del usuario nuevo. Fix: `selectedRef` (id del usuario vigente);
   toda actualización tardía se descarta si `selectedRef.current !== reqUser`.
2. **`pendingId` único (low)**: dos toggles concurrentes se pisaban el spinner.
   Fix: `Set<string>` de ids pendientes.
3. **Sin estado "sin resultados" (low)**: una búsqueda válida sin coincidencias
   mostraba el hint de "escribe 2 letras". Fix: clave `grant.noResults`.
4. **Sin estado "sin logros" (low)**: catálogo vacío dejaba un hueco. Fix:
   clave `grant.noBadges`.

## Verificación

`pnpm typecheck` ✅, `pnpm build` (webpack) ✅, lint ✅, JSON i18n válido (es+en
en paridad).

## Estado de la feature

Las 3 fases del sistema de badges custom están completas: catálogo en BD
(024), panel /admin con CRUD + condiciones title_season (025), y otorgar a mano
(026). Pendiente opcional: season-tracking de anime para habilitar `title_season`
con anime (hoy restringido a series TMDB).
