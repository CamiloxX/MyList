# 039 — Comparativa año a año en /stats

## Qué se hizo

1. **Refactor previo**: `StatTile`, `BarList`, `KindHoursBar` y `EmptyHint`
   salieron de `stats/page.tsx` (estaban inline) a
   `src/features/stats/components/charts.tsx` para que la comparativa anual y
   el Wrapped los reutilicen. Sin cambios visuales.
2. **`getYearlyStatsForUser`** en `stats/queries.ts`: una sola pasada por todo
   el historial (`fetchAllRows` paginado — es la única query all-history con
   join, así que el tope de ~1000 filas de PostgREST importaba aquí), bucketing
   en memoria por año: entradas, horas (mismo estimador: runtime ?? 22 min para
   tv/anime), horas por tipo y género dominante (vía `genreLabel`).
3. **Sección "Año a año"** al final de `/stats`: por año, dos barras (vistas y
   horas) normalizadas al máximo global, delta % vs el año anterior (▲ verde /
   ▼ rojo, `tabular-nums`) y chip con el género dominante. Divs+Tailwind, sin
   librería de charts (patrón de la casa).
4. De paso: `getTopOfYear` ganó su core inyectable `getTopOfYearForUser` (con
   filtro `user_id` explícito, antes confiaba solo en RLS) y `computeStreaks`
   se exporta — ambos los necesita el Wrapped (doc 040).

## Nota futura

Si la biblioteca supera ~2-3k entradas conviene mover la agregación a una RPC
SQL (`GROUP BY extract(year ...)`) — eliminaría también el techo latente de
`getUserOverview`/`getActivityStats` con historiales grandes.
