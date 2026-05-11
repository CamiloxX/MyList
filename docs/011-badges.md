# 011 — Sistema de badges (logros)

## Qué se agregó

- **Página `/badges`** con grid de los 8 badges del catálogo, filtros (Todos / Desbloqueados / En progreso) y barra de progreso por badge no obtenido.
- **Toast** (sonner) cuando una acción del usuario desbloquea un badge nuevo.
- **Mini-resumen "Logros recientes"** en `/settings` (últimos 3 desbloqueados + link a `/badges`).
- **Link "Logros"** en el top-nav (desktop) y en el bottom-nav (mobile, reemplazando el item de "Buscar" — search sigue accesible vía `HeaderSearch`).

## Decisiones de diseño

- **Catálogo en código** (`src/features/badges/catalog.ts`), no en BD: cero overhead, type-safety total, agregar un badge = un objeto + dos claves i18n.
- **Una sola tabla** `user_badges (user_id, badge_id, earned_at)` con PK compuesta para idempotencia y RLS owner-only (migración `002_badges.sql`).
- **Evaluador en path crítico**: cada server action de escritura "positiva" (`addToLibrary`, `updateLibraryStatus`, `addWatchEntry`) llama `evaluateAndPersist` antes del `revalidatePath`. Eficiente: si todos los badges ya están desbloqueados, salta la query de aggregates.
- **Soft-fail**: si la evaluación o el insert fallan, la action sigue devolviendo `ok: true` — los badges no son críticos para la operación principal y se re-evaluarán la próxima vez (incluso al visitar `/badges`).
- **Las actions de borrado** (`removeFromLibrary`, `removeWatchEntry`) NO desbloquean badges — innecesario.

## Catálogo inicial (8 badges)

| ID | Criterio | Tier |
|---|---|---|
| `first_watch` | 1ª visualización registrada | bronze |
| `cinephile_10` | 10 películas con status="watched" | bronze |
| `series_finisher_5` | 5 series con status="watched" | silver |
| `otaku_5` | 5 animes con status="watched" | silver |
| `critic_20` | 20 visualizaciones con `rating` | bronze |
| `marathon_3` | 3 visualizaciones en un mismo `watched_on` | silver |
| `genre_explorer_5` | 5 géneros distintos en obras vistas | silver |
| `streak_7` | 7 días consecutivos con al menos una visualización | gold |

Para añadir un badge: editar `catalog.ts` (id + criterion + iconKey + i18nKey + tier), agregar las claves `badges.items.<i18nKey>.{name,description}` en `es.json` y `en.json`, y — si el criterion usa un `kind` nuevo — extender `BadgeCriterion` y `progressFor()` en el evaluator. TypeScript exige el handler exhaustivo, así que olvidar el match no compila.

## Archivos clave

- `supabase/migrations/002_badges.sql` — tabla + RLS + índices.
- `src/features/badges/` — feature completa (catalog, evaluator, queries, notify, types, components).
- `src/features/library/actions.ts` — invocaciones a `evaluateAndPersist` y propagación de `newBadges` en el Result.
- `src/app/[locale]/(app)/badges/page.tsx` — página con grid.
- `src/app/[locale]/(app)/layout.tsx` y `src/features/shell/components/bottom-nav.tsx` — navegación.

## Lo que no se hizo (fuera de alcance)

- Compartir badges / perfil público.
- Admin UI para editar badges (no aplica con catálogo en código).
- Notificación tipo modal celebratorio: el toast cubre el caso por ahora.
