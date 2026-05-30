# 019 — Ordenar títulos de una lista por criterio

## Qué se hizo

Menú "Ordenar por" en el detalle de una lista, con cuatro criterios que
**reescriben `position`** de forma persistente:

- Título (A-Z)
- Año (recientes primero)
- Año (antiguos primero)
- Tipo (película → serie → anime, alfabético dentro de cada grupo)

Piezas:

- **`sortListItems(listId, criterion)`** en `src/features/lists/actions.ts`:
  carga los ítems con `title/year/kind`, ordena en JS según el criterio
  (validado con `z.enum(LIST_SORT_CRITERIA)`) y persiste el orden con un
  `upsert` masivo reasignando `position` a `0..n-1` (`onConflict`
  `list_id,media_item_id`). Los títulos sin año caen al final en ambas
  direcciones. RLS garantiza propiedad de la lista.
- **`SortListMenu`** (`components/sort-list-menu.tsx`): Popover con las opciones,
  mismo patrón que `ListSettings`. Refresca con `router.refresh()`.
- En `lists/[id]/page.tsx` se muestra solo cuando la lista tiene **más de un
  título** (`data.items.length > 1`).
- Claves i18n `lists.sortLabel` + `lists.sort.*` en `es.json` y `en.json`.

## Por qué así

- El orden se persiste reescribiendo `position` (no es un sort solo de vista),
  así **convive con el orden manual** de las flechas (doc 018): ordenas por un
  criterio como punto de partida y luego ajustas a mano si quieres.
- `upsert` de un solo viaje en vez de N updates: una sola llamada para reordenar
  toda la lista.
- Se reutiliza `LIST_SORT_CRITERIA` como única fuente de verdad para el enum del
  schema, las opciones del menú y las claves i18n.
