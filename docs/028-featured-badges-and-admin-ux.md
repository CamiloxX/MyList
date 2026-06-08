# 028 — Logros destacados elegibles + ajustes de UX del admin

Tres cambios relacionados con badges, a partir de feedback del usuario.

## 1. Logros destacados elegibles por el usuario

Cada usuario puede elegir **hasta 4** de sus logros desbloqueados para mostrarlos
junto a su nombre en los **comentarios** (no hay página de perfil pública todavía;
cuando exista, reusa lo mismo). Si no elige ninguno, se muestran los más recientes
(comportamiento previo).

- **Migración** `20260608000000_featured_badges.sql`: `profiles.featured_badge_ids
  text[] not null default '{}'`. La RLS `profiles_update_own` (auth.uid()=id) ya
  cubre la escritura.
- **Action** `updateFeaturedBadges(badgeIds)` (`src/features/badges/actions.ts`,
  nuevo `"use server"`): dedupe + cap a `MAX_FEATURED_BADGES` (4), **filtra a ids
  que el usuario realmente desbloqueó** (un cliente manipulado no puede destacar
  badges ajenos), update con `.eq("id", user.id)`. Aborta si la lectura de
  `user_badges` falla (no vacía la selección por un error transitorio).
- **Query** `getEarnedBadgesForCurrentUser()` (earned + featured) y
  `fetchBadgesByUserIds` (comentarios) ahora **prefiere los destacados** (filtrados
  a still-earned, en el orden elegido) y cae a los 4 más recientes si no hay.
- **UI** `FeaturedBadgesCard` (sección nueva en Ajustes): grid de logros con toggle
  optimista. Los guardados están **serializados** (un request en vuelo a la vez,
  coalescing del último estado vía refs) para que toggles rápidos no pierdan un
  cambio ni lleguen desordenados; un fallo revierte a lo último persistido.
- i18n `badges.featured.*` (es + en).

## 2. La condición por defecto al crear un badge es "Título completo"

`badge-form-drawer` arrancaba en `title_season` (solo TMDB series), así que el
buscador de anime no se veía. Ahora el default es `title_completed`, que muestra
el toggle **TMDB / Anime (MyAnimeList)** de entrada — el camino que cubre anime.

## 3. Hint de la condición "manual" corregido

`condition.manualHint` decía "función próximamente", pero la herramienta de
otorgar a mano ya existe (Fase 3, `docs/026`). Ahora apunta a la sección
«Otorgar a mano» de `/admin`.

## Verificación

Revisión adversarial (workflow): 2 hallazgos low corregidos — (a) la action
borraba la selección ante un error de lectura, (b) toggles rápidos podían
perder un cambio. `pnpm typecheck` ✅, `pnpm build` ✅, `pnpm test` (45) ✅,
lint ✅, JSON i18n válido (es+en).
