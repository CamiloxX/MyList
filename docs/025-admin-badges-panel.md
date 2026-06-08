# 025 — Panel /admin de badges (Fase 2)

## Qué se hizo

Segunda fase del sistema de badges custom: un panel de administración para
crear, editar, activar/desactivar y borrar logros, con subida de imagen propia
y un selector de condición de desbloqueo. Construido sobre la tabla `badges`
DB-driven de la [Fase 1](024-badges-db-catalog.md).

### Ruta y acceso

- `src/app/[locale]/(app)/admin/layout.tsx` gatea toda la sección por
  `profiles.is_admin` (redirige a `/library` a los no-admin logueados; el
  `(app)/layout` ya manda a `/login` a los anónimos). El gate de UI es
  **advisory**: la autoridad real son las RLS y el `requireAdmin()` que cada
  server action re-verifica.
- `src/app/[locale]/(app)/admin/page.tsx` (force-dynamic) lista los badges.
- Link "Admin" en el header desktop (`(app)/layout.tsx`) y en el menú "Más"
  móvil (`bottom-nav.tsx` recibe `isAdmin`), visible solo para admins.

### Feature `src/features/admin/`

- `schemas.ts` (sin `"use server"`): `badgeFormSchema`/`createBadgeSchema` (Zod),
  `badgeCriterionSchema` (discriminated union que espeja `BadgeCriterion`),
  constantes de icono y `slugifyBadgeId`. **Todo valor no-función vive aquí** por
  la regla de "use server".
- `actions.ts` (`"use server"`): `requireAdmin()` + `createBadge`, `updateBadge`,
  `toggleBadgeActive`, `deleteBadge`, `uploadBadgeIcon`, `removeBadgeIcon`, y los
  helpers de búsqueda `searchSeriesForBadge` / `getSeriesSeasonsForBadge`. Cada
  mutación abre con `requireAdmin()`.
- `queries.ts` (server-only): `getBadgesForAdmin()` devuelve las filas crudas
  (activas e inactivas) con el criterio parseado.
- `components/`: `admin-badges-panel` (grid + botón crear + drawer compartido),
  `badge-admin-card` (tarjeta + menú de acciones con confirmación inline de
  borrado), `badge-form-drawer` (form RHF+zod en bottom-sheet, subida de icono),
  `condition-fields` (selector de tipo de condición + campos condicionales) y
  `series-picker` (buscador de series TMDB + temporada).

### Subida de icono

Mismo patrón que portadas de listas/avatares: el cliente hace
`downscaleImageToWebp(file, 256)` y manda el Blob por `FormData` a
`uploadBadgeIcon`, que valida mime/tamaño, sube a `badge-icons/<badgeId>.<ext>`
(upsert + cache-bust `?v=`), y escribe `badges.icon_url`. Como el path apunta al
badge, **el row se crea primero y luego se sube el icono**.

### Condición de desbloqueo

El selector produce el `criterion` jsonb. Soporta:
- **`title_season`**: buscador de **series TMDB** (`searchSeriesForBadge`,
  filtrado a `media_type === 'tv'`) + selector de temporada
  (`getSeriesSeasonsForBadge`). Captura `source='tmdb'`, `sourceId=String(tmdbId)`
  y `season` idénticos a lo que guarda la biblioteca, para que el match del
  evaluador (`${source}:${sourceId}:${season}`) funcione.
- **`manual`**: sin condición automática (se otorgará a mano en la Fase 3).
- Los **contadores** existentes (para editar las 15 badges built-in).

**Limitación conocida (decisión consciente):** el tracking por temporadas solo
existe para series TMDB. El anime (source `anilist`/Jikan) no registra
`season_number`, así que `title_season` se restringe a series TMDB; el hint del
formulario lo avisa. Para anime queda la vía de "otorgar a mano" (Fase 3) o
añadir season-tracking de anime más adelante.

## Cómo se construyó / verificó

- Mapeo previo de patrones del codebase con un workflow de entendimiento
  (routing/gating, subida de imágenes, server actions, búsqueda TMDB/Jikan,
  primitivas UI/RHF/Drawer, nav/i18n).
- Revisión adversarial multi-agente del diff (5 dimensiones + verificación
  independiente de cada hallazgo). Se confirmaron y corrigieron 5 issues:
  1. `sortOrder` vacío → `NaN` bloqueaba el submit en silencio (saneado a 0 con
     `setValueAs`).
  2/4. En edición, el `title_season` mostraba el id crudo en vez del nombre de la
     serie (`getSeriesSeasonsForBadge` ahora también devuelve el título; nuevo
     `getTmdbTvSummary` en `lib/tmdb/tv.ts`).
  3. Fallo de subida de icono mostraba toasts contradictorios (ahora un único
     mensaje según resultado; clave `form.iconUploadFailedButSaved`).
  5. El select de temporada quedaba en blanco si la temporada guardada no estaba
     en la lista (se normaliza a la primera disponible).
- `pnpm typecheck` ✅, `pnpm build` (webpack) ✅, lint de los archivos nuevos ✅,
  JSON de i18n válido. Namespace `admin` completo en es **y** en.

## Pendiente (Fase 3)

- Herramienta de **otorgar a mano** un badge a un usuario (buscar usuario +
  insertar en `user_badges`; ya existe la política RLS admin-insert).
- (Opcional) Season-tracking de anime para habilitar `title_season` con anime.
