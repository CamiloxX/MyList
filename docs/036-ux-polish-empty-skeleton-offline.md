# 036 — Pulido UX: EmptyState, skeletons contextuales, offline y maskable

## 1. `EmptyState` reutilizable

`src/components/empty-state.tsx` (Server-Component friendly; props `title`,
`description?`, `icon?`, `action?`, `size: md|sm`). Reemplaza 14 copias inline
del mismo markup `border-dashed p-12 text-center` en library, search (página +
resultados TMDB/anime), discover (grid + página), stats (vacío principal +
`EmptyHint`), lists (índice, discover, detalle), month y changelog. Los avisos
pequeños (title-comments, watch-entry-list, etc.) se quedan como están: no son
estados vacíos de página.

## 2. Skeletons contextuales

Nuevos `loading.tsx` con esqueleto específico en `library`, `stats`, `lists` y
`watch-order`; `(app)/loading.tsx` (LoadingScreen) queda como fallback del
resto. Caveat documentado: el shell real elige móvil/desktop por User-Agent,
el skeleton solo puede aproximar por breakpoint (filas de card en <md, grid de
pósters en ≥md). Verificables con `LOADING_DEMO_MS=1500 pnpm dev`.

## 3. Página offline real

- `public/offline.html`: documento autocontenido (CSS inline, bilingüe por
  prefijo de locale del pathname, botón reintentar). Es la excepción sancionada
  a la regla i18n: el SW necesita precachear un documento estático sin runtime.
- `middleware.ts`: `offline.html` excluido del matcher — sin esto next-intl
  redirige a `/es/offline.html` y el `cache.add` del install falla.
- `public/sw.js` → **v5**: precachea `["/offline.html", "/"]`; fallback de
  navegación: página cacheada → `/offline.html`. Al activar purga `mylist-v4`.

## 4. Iconos maskable

`public/icon-maskable-192.png` y `-512.png` generados con
`scripts/generate-maskable-icons.mjs` (sharp desde el store de pnpm — no es
dependencia nueva): logo al 80% del lienzo sobre `#0a0a0a` para sobrevivir las
máscaras circulares de Android. Declarados en `src/app/manifest.ts` con
`purpose: "maskable"` junto a la entrada `any` original.

## Verificación

- Skeletons: `LOADING_DEMO_MS=1500 pnpm dev` y navegar entre rutas.
- Offline: build de prod → DevTools → Application (SW v5 activo, v4 purgada) →
  Network Offline → navegar a una ruta no cacheada muestra offline.html.
- Manifest: DevTools → Application → Manifest muestra los maskable sin recorte.
