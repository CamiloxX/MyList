# 006 — TMDB client + buscador

**Fecha:** 2026-05-09
**Hito:** 1
**Tareas:** 8 (+ adelanto parcial de la 9: action `addToLibrary`)

## Qué se hizo

### Cliente TMDB

```
src/lib/tmdb/
├── client.ts         # tmdbFetch wrapper + tmdbImage helper
├── schemas.ts        # Zod: tmdbMovieSchema, tmdbTvSchema, tmdbMultiResponseSchema
└── search.ts         # searchTmdb + helpers (tmdbTitle, tmdbYear, tmdbOriginalTitle)
```

- `tmdbFetch<T>` agrega `api_key` y `language=es-ES`, fuerza `revalidate` por
  defecto a 1 hora (ajustable). Lanza con mensaje claro si la respuesta no es
  2xx.
- `tmdbImage(path, size)` arma la URL completa (`https://image.tmdb.org/...`).
- `searchTmdb(query)` llama `/search/multi` con `revalidate: 0` (las búsquedas
  no se cachean), valida con Zod, y filtra los resultados de tipo `person`.
- `searchTmdb` solo se importa desde server-side (`import "server-only"`).
- `next.config.ts`: `images.remotePatterns` agrega `image.tmdb.org`.

### UI de búsqueda

```
src/features/search/components/
├── search-input.tsx     # Client; debounced (300ms) update de URL ?q=...
├── search-results.tsx   # Server; llama searchTmdb y renderiza la lista
└── media-card.tsx       # Server; póster + título + año + overview + botón
src/lib/hooks/
└── use-debounced-value.ts  # hook genérico

src/app/(app)/search/page.tsx  # SearchInput + Suspense<SearchResults key={q}>
```

- **Patrón URL-driven**: el input actualiza `?q=` con `router.replace()`, el
  page lee `searchParams`, RSC dispara la query. Esto da:
  - URL compartible y deep-linkable
  - Histórico del navegador funciona
  - Streaming + Suspense: skeleton mientras la búsqueda corre
- `key={trimmed}` en el `<Suspense>` hace que el fallback se muestre en cada
  query nueva (no se queda mostrando el resultado anterior).
- `force-dynamic` en la página: nunca cachear (la búsqueda depende del usuario
  y del query string).

### Add-to-library

```
src/features/library/
├── schemas.ts                            # Zod addToLibrarySchema
├── actions.ts                            # addToLibrary server action (upsert)
└── components/add-to-library-button.tsx  # Client; useTransition + toast
```

- `addToLibrary` usa `upsert` con conflict target `(user_id, source, source_id, kind)`.
  Si el usuario clickea el mismo título dos veces, se actualizan los metadatos
  pero no se duplica.
- Status inicial: `pending`. El usuario edita el estado después desde la
  biblioteca (próxima tarea).
- `revalidatePath("/library")` para que la lista refleje el cambio.

### Header / nav

- `(app)/layout.tsx` ahora tiene links a Biblioteca y Buscar, además del botón
  Salir. Los links usan `Link + className(buttonVariants(...))` porque el
  `Button` de shadcn 4 (Base UI) no acepta `asChild` (la API equivalente es
  `render`, pero con Next Link es más simple aplicar las clases directo).

## Verificación funcional

| Check | Resultado |
|---|---|
| `pnpm typecheck` | ✓ sin errores |
| `pnpm check` (Biome) | ✓ 48 archivos limpios |
| `pnpm build` | ✓ rutas nuevas: `/search` (dynamic) |
| `GET /search?q=interstellar` sin auth | ✓ 307 → /login |
| TMDB API directo con la key configurada | ✓ retorna "Interstellar" en español |

**Falta probar manualmente** (necesita estar logueado en navegador):
- `/search` con query → ver tarjetas con póster
- Click "Agregar" → toast "Agregado a tu biblioteca" → botón pasa a "Agregado"
- `/library` debe mostrar el item agregado (la vista lista llega en tarea 10).

## Notas / decisiones

- **Imágenes vía `next/image` directo desde TMDB CDN**: cero costo de Storage,
  Next se encarga de optimización en el edge. `remotePatterns` en
  `next.config.ts`.
- **`force-dynamic` en `/search`**: evita cachear pages con searchParams
  variables, que es contraproducente acá.
- **`addToLibrary` adelantado**: técnicamente es de la tarea 9, pero sin él
  el botón de la card no haría nada y el flujo del usuario quedaría roto.
  La parte CRUD restante (editar status, detalle, eliminar, watch entries)
  sigue en la tarea 9.
- **Anime queda fuera**: TMDB tiene anime pero metadatos pobres. La pestaña
  anime con AniList se agrega en Hito 2.
