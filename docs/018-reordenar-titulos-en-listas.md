# 018 — Reordenar títulos dentro de una lista

## Qué se hizo

Se agregó la posibilidad de reordenar los títulos de una lista personalizada
con controles de subir/bajar (flechas) en cada fila del detalle de la lista.

- **`moveListItem(listId, mediaItemId, direction)`** en
  `src/features/lists/actions.ts`: carga los ítems ordenados por `position`,
  encuentra el vecino en la dirección pedida e **intercambia los valores de
  `position`** de ambas filas. Es *gap-safe* (intercambia valores guardados, no
  índices), así que sobrevive a los huecos que dejan las eliminaciones. En los
  bordes (primero/último) es un no-op que devuelve `ok`.
- **`ReorderItemButtons`** (`components/reorder-item-buttons.tsx`): client
  component con dos botones (Chevron arriba/abajo) que llaman a la acción y
  refrescan con `router.refresh()`. Sigue el mismo patrón que
  `RemoveFromListButton`. Los botones se deshabilitan en los extremos.
- La página `lists/[id]/page.tsx` pasa `isFirst` / `isLast` calculados del
  índice del map y coloca las flechas al inicio de cada fila.
- Claves i18n `lists.moveUp` / `lists.moveDown` en `es.json` y `en.json`.

## Por qué así

- El campo `position` ya existía en `list_items` y se asignaba al agregar, pero
  no había forma de modificarlo. Esta es la pieza de pulido más directa.
- Se eligieron botones subir/bajar en vez de drag & drop para **no introducir
  librerías nuevas** (el stack está cerrado) y porque funcionan bien en móvil y
  son accesibles por teclado.
- RLS de `list_items` (vía propiedad de la lista) garantiza que solo el dueño
  puede reordenar; la acción además valida los UUID y la sesión.
