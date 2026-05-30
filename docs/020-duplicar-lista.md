# 020 — Duplicar lista

## Qué se hizo

Opción **"Duplicar"** en el menú kebab del detalle de una lista
(`ListSettings`). Clona la lista en una nueva privada del mismo usuario,
copiando nombre, descripción y todos los títulos **conservando el orden**, y
redirige a la copia.

Piezas:

- **`duplicateList(sourceId, newName)`** en `src/features/lists/actions.ts`:
  lee la lista origen (RLS la limita al dueño), crea la nueva con `newName`
  (validado con `listFormSchema.shape.name`) + la misma descripción, y copia las
  filas de `list_items` con sus `position` intactas. La **portada no se copia**
  (apunta a un archivo en storage de la otra lista); la copia usa el collage
  auto-generado de pósters.
- En `list-settings.tsx` el nombre de la copia se arma en el cliente con i18n
  (`{name}` + `copySuffix`), recortando la base para no pasar `LIST_NAME_MAX`
  (60). Así el sufijo "(copia)" queda en i18n y no hardcodeado en el server.
- Claves i18n `lists.duplicate`, `lists.duplicated`, `lists.copySuffix` en
  `es.json` y `en.json`.

## Por qué así

- El sufijo de la copia lo construye el cliente y lo pasa como `newName`, en vez
  de que el server arme texto de UI en español (regla: nada de strings de UI
  hardcodeados; todo vía i18n).
- La nueva lista nace `private` (visibilidad por defecto): duplicar no debe
  re-exponer algo que estaba compartido por link.
- Se copian `position` tal cual para preservar el orden manual/ordenado del
  origen (docs 018 y 019).
