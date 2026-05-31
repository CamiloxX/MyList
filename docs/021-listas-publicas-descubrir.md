# 021 — Listas públicas + Descubrir

## Qué se hizo

Tercer estado de visibilidad para las listas (`public`) y una vista
**"Descubrir"** que las explora. El enum `visibility_level` ya incluía
`public` desde la migración 001, así que **no hizo falta migración**.

### Visibilidad de 3 estados
- `private`: solo el dueño.
- `unlisted`: cualquiera con el enlace (no aparece listada).
- `public`: además se muestra en Descubrir.

`setListShared(id, boolean)` → reemplazado por **`setListVisibility(id, level)`**
en `actions.ts` (validado con `z.enum(LIST_VISIBILITY)`). `ShareListButton` pasa
a manejar los 3 estados: al compartir queda `unlisted`; el popover ofrece copiar
enlace, **mostrar/quitar de Descubrir** (toggle public↔unlisted) y dejar de
compartir (private). `getListWithItems` ahora expone `visibility` cruda en vez
del booleano `shared`.

### Vista Descubrir
- **`getPublicLists()`** en `queries.ts`: con service-role lee todas las listas
  `public` (RLS solo-dueño las ocultaría), ordenadas por más recientes, con
  preview de pósters + autor. `lists.user_id` y `profiles.id` apuntan ambas a
  `auth.users` pero no hay FK directa para un embed de PostgREST, así que el
  autor (`display_name`, `avatar_url`) se resuelve en una segunda query. Solo se
  exponen campos públicos de display.
- Ruta **`/lists/discover`** (`app/[locale]/(app)/lists/discover/page.tsx`):
  grid de listas públicas que enlaza a la vista pública existente `/share/[id]`
  (ya servía cualquier lista con `visibility != 'private'`). Segmento estático,
  con prioridad sobre `/lists/[id]`.
- Link "Descubrir" (icono brújula) en el header del índice de listas.
- Claves i18n `lists.share.{publicHint,makePublic,makeUnlisted}` y
  `lists.discover.*` en `es.json` y `en.json`.

## Por qué así

- **Sin RLS nueva**: se reusa el patrón ya establecido del proyecto (service-role
  acotado a lectura pública, como `getSharedList`) en vez de abrir políticas de
  lectura cruzada entre usuarios.
- Las públicas reutilizan `/share/[id]` como página de detalle: una sola vista
  pública para unlisted y public, menos superficie que mantener.
- Marcar pública nunca es el primer paso: al compartir queda `unlisted`, y
  hacerla pública es una acción explícita extra en el popover.
