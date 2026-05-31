# 023 — Fix: crash al cambiar de estado ("This page couldn't load")

## Síntoma

Al cambiar el estado de visualización de un título (Viendo / Vista / etc.), la
app mostraba la pantalla de error de producción de Next.js: *"This page couldn't
load. A server error occurred."* con un digest (`ERROR …@E352`). En dev el error
real era:

```
Error: A "use server" file can only export async functions, found object.
  at module evaluation (… library/[id]/page/actions.js (server actions loader))
```

## Causa raíz

`src/features/lists/actions.ts` lleva la directiva `"use server"`. Next.js exige
que un archivo así **solo exporte funciones async**. Sin embargo exportaba dos
constantes en runtime (arrays `as const`):

- `export const LIST_SORT_CRITERIA = [...]`
- `export const LIST_VISIBILITY = [...]`

(introducidas en los commits de ordenar listas / listas públicas).

Esto rompe la **evaluación de todo el módulo** de Server Actions. Como la página
de la biblioteca y la de detalle importan acciones de listas (`AddToListButton`,
etc.), el "server actions loader" de esas rutas agrupa `lists/actions.ts`, y al
fallar su evaluación **cualquier** Server Action de la página —incluido
`updateLibraryStatus`— devuelve 500. El cambio de estado dispara justo un POST de
Server Action, de ahí el crash. `pnpm typecheck` pasaba porque es código TS
válido; la regla es exclusiva de runtime de Next.

## Arreglo

Se movieron las constantes (y sus tipos derivados) a un módulo nuevo sin
`"use server"`:

- **Nuevo:** `src/features/lists/constants.ts` con `LIST_SORT_CRITERIA`,
  `ListSortCriterion`, `LIST_VISIBILITY`, `ListVisibility`.
- `lists/actions.ts` las importa para uso interno (los `z.enum(...)`), ya no las
  exporta.
- `components/sort-list-menu.tsx` y `components/share-list-button.tsx` importan
  los valores/tipos desde `../constants` (las funciones siguen viniendo de
  `../actions`).

Verificado en dev: la ruta de la biblioteca/detalle ya evalúa el módulo de
acciones sin error y responde 200.

## Para no repetirlo

Un archivo `"use server"` no debe exportar constantes, objetos, schemas de Zod ni
tipos-como-valor: solo funciones async. Las constantes/tipos compartidos van en
un archivo aparte.
