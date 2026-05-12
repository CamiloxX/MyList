# 010 — Feature Discover (recomendaciones, plataformas, ratings)

**Fecha:** 2026-05-10
**Hito:** Bonus sobre Hito 1 (no estaba en el roadmap original).

## Qué se hizo

Nueva sección `/discover` con tres pestañas (Tendencias, Por género, Para ti),
selectores de tipo (peli/serie/anime), filtros de género, plataforma de
streaming y región, paginación anterior/siguiente, y badges de ratings de
Rotten Tomatoes / IMDb / Metacritic vía OMDb.

## Arquitectura

```
src/lib/tmdb/discover.ts        # /discover, /trending, /watch/providers, /external_ids, /genre
src/lib/tmdb/schemas.ts         # extendido con discover/genre/external/watch-provider schemas
src/lib/jikan/discover.ts       # /top/anime, /anime (filtrado), /anime/{id}/recommendations, /genres/anime
src/lib/jikan/schemas.ts        # extendido con genre/recommendations schemas
src/lib/omdb/                   # cliente nuevo + schemas (opcional)

src/features/discover/
├── schemas.ts                  # Zod: tab, type, region, provider, genre, year, page
├── queries.ts                  # fetchers server-side, normalización TMDB/Jikan
├── recommend.ts                # algoritmo "Para ti" basado en biblioteca
├── ratings.ts                  # enrichment OMDb en paralelo (Promise.allSettled)
├── index.ts                    # barrel export
└── components/
    ├── discover-tabs.tsx       # Tendencias | Por género | Para ti
    ├── media-type-tabs.tsx     # Películas | Series | Anime
    ├── genre-filter.tsx        # <select> nativo
    ├── region-filter.tsx       # CO/MX/AR/CL/BR/US/ES
    ├── provider-filter.tsx     # plataformas según región
    ├── pagination-controls.tsx # prev/next link-based
    ├── ratings-badge.tsx       # RT/IMDb/Meta con tono semáforo
    └── discover-grid.tsx       # render server, enriquece con OMDb si hay key

src/app/[locale]/(app)/discover/page.tsx
```

## Decisiones

### TMDB para peli/serie, Jikan para anime
- TMDB ya estaba en el stack y tiene endpoints excelentes:
  `/discover/{movie|tv}` con filtros ricos (género, año, voto, plataforma,
  región, sort), `/trending/{type}/week`, `/{type}/{id}/recommendations`,
  `/genre/{type}/list`, `/watch/providers/{type}`.
- Jikan (REST sobre MAL) ya estaba en el stack tras el switch desde AniList.
  Trending de anime usa `/top/anime?filter=airing` (lo que está emitiendo
  esta temporada, ranqueado por score) — más útil que `bypopularity` que
  devolvía siempre los clásicos históricos.

### Algoritmo "Para ti" (`src/features/discover/recommend.ts`)
1. Lee la biblioteca del usuario desde Supabase (RLS protege la query).
2. Cuenta los géneros más frecuentes por kind (movie/tv/anime).
3. Toma los top 3 géneros por kind, llama a `/discover` (TMDB) o `/anime`
   (Jikan) con esos géneros, sort por popularidad/score, umbral mínimo de
   voto (TMDB ≥6, Jikan score ≥7).
4. Filtra los IDs que ya están en la biblioteca del usuario.
5. Devuelve hasta 8 títulos por kind.
6. Si la biblioteca está vacía, fallback a Tendencias con un aviso visible.

Para anime los géneros se almacenan como nombres (no IDs), así que mapeamos
nombre → mal_id consultando `/genres/anime` (cache 1 día).

### OMDb opcional (`src/lib/omdb/` + `OMDB_API_KEY`)
- La env var es **opcional**. Si está, cada card TMDB se enriquece con
  ratings de Rotten Tomatoes / IMDb / Metacritic.
- Si no está, el lookup se cortocircuita (no hay llamadas de red) y los
  badges simplemente no se renderizan.
- El enrichment vive en `src/features/discover/ratings.ts`:
  hace `Promise.allSettled` sobre los items, resolviendo primero el imdb_id
  vía `/movie/{id}/external_ids` o `/tv/{id}/external_ids` y luego pidiendo
  los ratings a OMDb. Cache de 1 semana (los scores casi no cambian).
- Errores de red o 404 de OMDb → `null` silencioso, no rompen la card.

### Filtro de plataforma + región
- `with_watch_providers` requiere `watch_region` en TMDB; los IDs de
  plataforma son globales pero el catálogo disponible varía por país.
- Regiones expuestas: CO, MX, AR, CL, BR, US, ES (default CO, configurable
  por searchParam `?region=`).
- En la pestaña Tendencias, si hay un provider seleccionado, fallback a
  `/discover` con `sort_by=popularity.desc` (porque `/trending` no admite
  filtro por proveedor).
- Cambiar región resetea el provider seleccionado (un id de plataforma
  válido en CO puede no existir en ES).
- Anime no expone este filtro (Jikan no lo soporta).

### Paginación
- Botones prev/next que cambian `?page=N`. Stateless, todo URL-driven.
- Heurística "hay más": `results.length >= 20`. TMDB devuelve 20 por página,
  Jikan hasta 25. Funciona bien para el UX prev/next.
- "Para ti" no tiene paginación (es un mix curado, no una lista paginable).

### URL como única fuente de verdad
Todos los filtros viven en `searchParams`:
`?tab=genre&type=movie&genre=28&region=CO&provider=8&page=2&year=2024`

Eso permite:
- Compartir links (un amigo abre tu mismo discover).
- Volver a la misma vista con back/forward del navegador.
- SSR puro sin estado cliente intermedio.

El parsing usa Zod con `.catch()` por campo, así que cualquier valor inválido
cae a default sin romper la página.

### Reuso de componentes existentes
- `MediaCard` y `AnimeCard` se reusan tal cual; `MediaCard` ahora acepta
  prop opcional `ratings` para el badge OMDb.
- `AddToLibraryButton` funciona sin cambios — añadir desde Discover es
  idéntico a añadir desde Search.

## Variables de entorno

```bash
# .env.local
TMDB_API_KEY=xxxxx              # ya existía, requerido
OMDB_API_KEY=xxxxx              # nuevo, opcional — gratis en omdbapi.com
```

## Cambios en navegación
- `src/features/shell/components/bottom-nav.tsx`: nueva entrada "Descubrir"
  con `CompassIcon` entre Biblioteca y Buscar.
- `src/app/[locale]/(app)/layout.tsx`: link "Descubrir" en el nav del header
  desktop.

## i18n
Todas las claves nuevas bajo `discover.*` y `nav.discover` en `es.json` y
`en.json`. Estructura:
```
discover.{title, subtitle, emptyResults}
discover.tabs.{aria, trending, genre, for-you}
discover.types.{aria, movie, tv, anime}
discover.filters.{genre, anyGenre, region, provider, anyProvider, regions.{CO,MX,...}}
discover.pagination.{aria, previous, next, page}
discover.forYou.{empty, fallbackNotice, sectionMovies, sectionTv, sectionAnime}
```

## Pendientes / Follow-ups
- Sección "Similares" en la ficha de detalle de biblioteca
  (`/library/[id]`) usando `getMovieRecommendations` / `getTvRecommendations`
  / `getAnimeRecommendations` que ya están implementados.
- Filtro por año en la UI (la query ya lo soporta vía
  `discoverFiltersSchema.year`).
- Selector de región global en /settings con persistencia en `profiles.locale`
  o columna nueva. De momento vive solo en searchParams.
- Test unitario de `getForYou`: validar conteo de géneros, exclusión de IDs
  ya en biblioteca, fallback a trending. La carpeta `tests/` está vacía.
