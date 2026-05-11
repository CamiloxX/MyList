# 009 — Hito 2: anime, vista anual, stats (+ middleware unificado)

**Fecha:** 2026-05-10
**Hito:** 2
**Tareas:** 14 (parcial), 15, 16, 17, 18

## Qué se hizo

### Google OAuth (tarea 14 — código listo, falta config)

- `src/features/auth/components/google-button.tsx`: botón con SVG inline del
  logo de Google + `useTransition`. Llama a `signInWithGoogle()` y hace
  `window.location.href` a la URL de consent.
- `src/features/auth/actions.ts`: `signInWithGoogle()` server action que pide
  a Supabase la URL de OAuth con `redirectTo` apuntando a `/auth/callback`.
- `src/app/auth/callback/route.ts`: route handler que recibe el `code` de
  Google, lo intercambia por una sesión Supabase, y redirige al `next`.
- Botón visible en `/login` y `/register` con separador "o" arriba.
- **Pendiente**: el usuario debe crear el OAuth Client en Google Cloud
  Console y pasarme `client_id` + `client_secret` para configurar en
  Supabase vía Management API.

### Cliente anime: Jikan (tarea 15, sustituye AniList)

- AniList tenía su parámetro `search:` devolviendo 0 resultados para
  cualquier query al momento del setup (sus consultas por ID sí funcionaban
  pero la búsqueda libre no). Probé múltiples variantes y la API estaba
  rota / con un cambio no documentado.
- **Switch a Jikan** (REST sobre MAL): respondió correctamente al instante.
  El plan original del usuario admitía "Jikan o AniList" así que cae dentro
  del scope.
- `src/lib/jikan/`:
  - `client.ts`: `jikanFetch<T>()` con cache 1h por defecto.
  - `schemas.ts`: Zod schemas para la respuesta de Jikan.
  - `search.ts`: `searchJikan(query)` + helpers `jikanTitle`,
    `jikanOriginalTitle`, `jikanPoster`, `jikanFormatLabel`,
    `jikanDurationMinutes` (parsea "23 min per ep" → 23).
- `next.config.ts`: agregado `cdn.myanimelist.net` a `remotePatterns`.

### Pestaña anime en /search (tarea 16)

- `search-tabs.tsx`: tabs URL-driven (`?type=anime`). Pelis y series sin
  param; anime con `type=anime`.
- `anime-card.tsx` + `anime-results.tsx`: equivalentes a los componentes
  TMDB pero leyendo Jikan. Reusan `AddToLibraryButton` con
  `source: "anilist"` (manteniendo el enum del schema; las variables
  externas pueden ser MAL pero internamente lo tratamos como "anilist"
  para el dominio).
- `/search/page.tsx` brancha por `?type` y renderiza `SearchResults` (TMDB)
  o `AnimeResults` (Jikan).

### Vista anual (tarea 17)

- `getYearSummary(year)` en `src/features/stats/queries.ts`: un query por
  año, buckets por mes en memoria.
- `/year/page.tsx`: 12 meses en grid, totales por mes + total anual,
  navegación prev/next año, atajo "Año actual" cuando estás viendo otro.
- Linkable desde `/month` (header de la página) y entre meses.

### Stats (tarea 18)

- Agregado a `queries.ts`:
  - `getUserOverview()`: totales + horas por kind (movie/tv/anime).
  - `getTopRatedMedia(limit)`: top N items por mejor rating en sus
    `watch_entries`.
  - `getTopOfYear(year, limit)`: top N de un año específico.
- `/stats/page.tsx`: 4 secciones (Resumen, Horas por tipo con barra
  stacked, Top calificadas, Top del año actual). Empty state si no hay
  visualizaciones registradas todavía.
- i18n keys agregadas en `es.json` y `en.json` bajo `stats.*`.

### Middleware unificado (Supabase + next-intl)

- El proyecto migró en paralelo a routing `[locale]/...` (next-intl) pero
  el middleware seguía mirando rutas planas. Resultado: `/` no redirigía
  a `/es/` y las rutas con prefijo fallaban en el guard de auth.
- Nuevo `middleware.ts`:
  1. Refresca sesión Supabase en cada request.
  2. `/auth/*` se deja pasar sin tocar i18n (callback OAuth no tiene
     locale).
  3. Strip del prefijo de locale en el path para evaluar redirects de
     auth con un solo set de reglas (funciona con `/library` y `/es/library`).
  4. Si no hay auth pero la ruta es `/{library|search|stats|...}` →
     redirect a `/login` (next-intl lo prefijeará con locale después).
  5. Si hay auth y la ruta es `/login` o `/register` → redirect a
     `/library`.
  6. Caso default: delega a `createIntlMiddleware(routing)` para que haga
     el routing/redirect de locales, forwardeando las cookies Supabase
     que se refrescaron.

## Por qué

- **Strip de locale para auth**: evita duplicar reglas para `/library` y
  `/es/library`. Una expresión sola cubre ambas. Si después agregamos más
  locales solo hay que ajustar el regex.
- **`/auth/*` por fuera de next-intl**: el callback OAuth de Supabase recibe
  un `code` directo sin contexto de locale, y forzarle un prefijo solo
  agregaría una redirección extra antes del exchange.
- **Forwardear cookies de Supabase** sobre la respuesta de next-intl:
  Supabase puede haber refrescado el JWT en este request; si no copiamos
  esas cookies a la respuesta final, el usuario se queda sin sesión hasta
  el próximo request.
- **Jikan en lugar de AniList**: pragmatismo. Si el endpoint principal de
  búsqueda no devuelve nada, no podemos esperar — el usuario quiere usar
  la app hoy. La arquitectura (cliente + schemas + componentes anime
  separados) sigue permitiendo cambiar de fuente sin tocar el dominio.

## Verificación

- `pnpm typecheck` ✓
- `pnpm check` (Biome) ✓ — 88 archivos limpios
- `pnpm build` ✓ — rutas registradas:
  ```
  ƒ /[locale]
  ƒ /[locale]/library
  ƒ /[locale]/library/[id]
  ƒ /[locale]/login
  ƒ /[locale]/month
  ƒ /[locale]/register
  ƒ /[locale]/search
  ƒ /[locale]/settings
  ƒ /[locale]/stats
  ƒ /[locale]/year
  ƒ /auth/callback
  ```
- `pnpm dev` smoke:
  - `GET /` → 307 → `/es/login` (via next-intl + auth middleware)
  - `GET /es/login` → 200
  - `GET /library` (sin auth) → 307 → `/login?next=/library` (luego
    next-intl lo prefijea)
- `pnpm test` ✓ — 45 tests pasan (no toqué tests; siguen verdes)

## Pendiente para cerrar el MVP

1. **Tarea 14 (Google OAuth)** — falta que el usuario cree el OAuth Client
   en Google Cloud Console y me pase `client_id` + `client_secret` para
   configurar en Supabase vía Management API.
2. **Tarea 13 (Deploy Vercel)** — necesita git init + repo GitHub + cuenta
   Vercel + env vars. Guía paso a paso cuando el usuario esté listo.
3. **Pestaña "Stats" en nav** (no la agregué para no chocar con cambios
   paralelos al `BottomNav` y `AppLayout`). Cuando el usuario confirme que
   no hay más trabajo paralelo activo, agrego `Stats` a header desktop y
   bottom nav móvil con la key `nav.stats` que ya existe en `es.json` y
   `en.json`.
