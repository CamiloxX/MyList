# 011 — Cards muestran "Agregado" si el ítem ya está en la biblioteca

**Fecha:** 2026-05-11
**Hito:** Fix sobre Hito 1.

## Problema

Al buscar (o explorar en Discover) un título que ya estaba en la biblioteca,
la card seguía mostrando el botón "Agregar". Hacer clic ejecutaba el upsert
contra `media_items`, que era idempotente vía la única `(user_id, source,
source_id, kind)`, así que no se duplicaba — pero la UX era confusa: el
usuario no sabía que ya lo tenía agregado y podía volver a "agregarlo"
sintiendo que algo fallaba.

El estado "Agregado" del botón vivía solo en `useState` local, así que se
perdía al recargar o al navegar a la página de búsqueda otra vez.

## Solución

Nuevo helper en `src/features/library/queries.ts`:

- `getLibraryItemKeys()` devuelve un `Set<string>` con todas las claves
  `source:kind:sourceId` de la biblioteca del usuario actual.
- `libraryItemKey({ source, sourceId, kind })` arma la clave canónica.

Cada listado de cards (Search TMDB, Search anime, Discover grid, Discover
"For You") consulta ese set en paralelo con su fuente de datos y pasa
`alreadyAdded` a `MediaCard` / `AnimeCard`, que lo propaga a
`AddToLibraryButton`. El botón inicializa su estado `added` con ese flag,
así sale ya deshabilitado mostrando "Agregado".

## Costo

Un único `select source, source_id, kind from media_items where user_id = ?`
por render de listado. Para una biblioteca personal (cientos de filas) es
trivial; el índice `(user_id, ...)` ya existe.

## No tocado

- El upsert ya era idempotente, no se cambió el server action.
- Si la query falla o el usuario está deslogueado, `getLibraryItemKeys()`
  devuelve un set vacío y el comportamiento previo (botón "Agregar" en
  todos) se mantiene como fallback seguro.
