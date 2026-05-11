# 007 — Library CRUD completo, vista mensual y shell responsive

**Fecha:** 2026-05-10
**Hito:** 1
**Tareas:** 9, 10, 11

## Qué se hizo

### Library CRUD (tarea 9)

`src/features/library/`:
- **`status.ts`**: constantes y labels en español para `MediaStatus` y `MediaKind`
  (Viendo / Vista / Pendiente / Abandonada; Película / Serie / Anime).
- **`schemas.ts`** + **`actions.ts`**: agregadas
  - `watchEntrySchema` (Zod): mediaItemId UUID, watchedOn `YYYY-MM-DD`, rating
    1-10 opcional, platform y notes opcionales.
  - `updateLibraryStatus(id, status)`: actualiza status; RLS asegura
    ownership.
  - `removeFromLibrary(id)`: borra item; las `watch_entries` se cascadean
    por FK.
  - `addWatchEntry(input)`: inserta visualización. Si el item estaba en
    `pending`, lo bumpea a `watching` automáticamente.
  - `removeWatchEntry(id, mediaItemId)`.

- **Componentes**:
  - `library-card.tsx`: refactorizado para linkear póster y título a
    `/library/[id]`. Mantiene `StatusSelect` y `RemoveButton` inline.
  - `library-filters.tsx`: chips para filtrar por status y kind vía
    URL (`?status=watching&kind=tv`). Estado activo destacado.
  - `status-select.tsx`: dropdown shadcn (Base UI). Llama a
    `updateLibraryStatus` con `useTransition`.
  - `remove-button.tsx`: pattern de dos pasos (Eliminar → Confirmar /
    Cancelar) sin necesidad de Dialog.
  - `watch-entry-form.tsx`: RHF + Zod; fecha (default hoy), rating 1-10
    opcional, platform (catálogo cerrado + "Otra" → texto libre), notas.
  - `watch-entry-list.tsx`: lista visualizaciones con botón eliminar por fila.

- **Detail page**: `src/app/(app)/library/[id]/page.tsx`. Muestra póster,
  metadatos, status edit, eliminar item, historial de visualizaciones y
  formulario para agregar nuevas.

### Vista mensual (tarea 10)

`src/features/stats/queries.ts`:
- `getMonthEntries(yearMonth)`: query a `watch_entries` con JOIN inner a
  `media_items` para el rango `[start, endExclusive)` del año-mes.
  Agrupa por fecha y calcula:
  - `totalEntries` (conteo)
  - `totalHours` (suma de `runtime_minutes`, con fallback 22 min para
    series/anime sin runtime conocido)
  - `entriesByDate` (Map fecha → MonthEntry[])

`src/app/(app)/month/page.tsx`:
- URL-driven: `?ym=2026-05`. Si no hay ym o es inválido, usa el mes actual.
- Navegación previa/siguiente + atajo "Mes actual" cuando estás viendo otro.
- Lista agrupada por día con poster, título, kind, rating y plataforma.
- Cada entry linkea a su `/library/[id]` para editarla.

### Date helpers

`src/lib/dates.ts` con `date-fns` + locale español:
- `todayIso()`, `currentYearMonth()`, `parseYearMonth()`,
  `yearMonthRange()`, `formatYearMonth()` (ej. "Mayo 2026"),
  `shiftYearMonth()`, `formatWatchedOn()` (ej. "Sáb 9 de may 2026").

### Shell responsive (tarea 11)

`src/features/shell/components/bottom-nav.tsx`:
- Bottom nav móvil (`md:hidden`) con 4 items (Biblioteca, Buscar, Mes,
  Ajustes), iconos de lucide-react.
- `aria-current="page"` para estado activo, `safe-area-inset-bottom`
  para iPhone.

`src/app/(app)/layout.tsx`:
- Header con nav links solo desktop (`hidden md:flex`).
- `<main>` con `pb-24 md:pb-6` para no quedar tapado por el bottom nav.
- Links nav agregados: Mes, Ajustes (además de Biblioteca, Buscar).

`src/app/(app)/settings/page.tsx`:
- Página mínima de ajustes: muestra email + display_name, botón cerrar
  sesión. Crecerá con preferencias en hitos siguientes.

## Por qué

- **Detail page en vez de Dialog inline** para watch entries: aprovecha el
  patrón web (URL navegable, historia del navegador, deep-linkable) y
  deja espacio para mostrar el historial completo. Más natural en móvil.
- **`pending → watching` automático** cuando registras la primera
  visualización: refleja la realidad (si lo viste, ya estás viéndolo) y
  evita un paso extra.
- **Estimación de horas conservadora**: usamos `runtime_minutes` cuando
  TMDB nos lo da; para series/anime sin runtime asumimos 22 min/episodio
  (estándar de medio bloque + comerciales). En Hito 2 podemos pedir
  `episodes_watched` por entry para ser más precisos.
- **Bottom nav solo móvil**: en desktop el header es suficiente; mostrar
  ambos satura. `md:hidden` / `hidden md:flex` es el patrón estándar.
- **Filters URL-driven**: igual que `/search?q=`, da deep-linking,
  back/forward del navegador funciona, y al recargar mantiene el estado.

## Verificación

- `pnpm typecheck` ✓
- `pnpm check` (Biome) ✓ — 62 archivos limpios
- `pnpm build` ✓ — rutas registradas:
  ```
  ƒ /library
  ƒ /library/[id]
  ƒ /month
  ƒ /search
  ƒ /settings
  ○ /login
  ○ /register
  ```
- Manual: el usuario ya tiene un item en BD (The Boys). Por probar:
  cambiar status, eliminar, ver detalle, registrar visualización,
  abrir vista mensual.

## Pendiente del Hito 1

- **Tarea 12**: Vitest setup + tests críticos (zod schemas, date helpers).
- **Tarea 13**: Deploy a Vercel (necesita git init + repo GitHub + cuenta
  Vercel, requiere intervención del usuario).
