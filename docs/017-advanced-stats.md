# 017 — Estadísticas avanzadas

## Qué se hizo

Cuatro bloques nuevos en `/stats`, todo con CSS/Tailwind (sin librerías de
charts, el stack está cerrado):

1. **Mapa de actividad (heatmap)** estilo GitHub, últimos ~12 meses
   (53 semanas × 7 días). Intensidad en 5 niveles según las visualizaciones de
   cada día. `getActivityStats()` lo arma desde `watch_entries.watched_on` en
   una sola query.
2. **Rachas** — racha actual (días seguidos hasta hoy/ayer) y mejor racha
   histórica, calculadas en JS desde el set de fechas. Se muestran como tiles en
   el resumen.
3. **Géneros más vistos** — `getLibraryBreakdown()` cuenta géneros entre los
   títulos vistos (media_items con ≥1 watch_entry).
4. **Distribución por década** — agrupa esos títulos por década del año de
   estreno.

## Detalle clave: géneros heterogéneos

Los géneros se guardan distinto según la fuente: **TMDB** los almacena como
**IDs numéricos** y **anime (Jikan)** como **nombres en inglés**. Se añadió
`src/lib/genres.ts` con:
- mapa estático de IDs de TMDB (movie+TV) → etiqueta es/en,
- mapa de nombres de anime → etiqueta en español (fallback: el nombre en inglés).

Así "géneros más vistos" mezcla ambas fuentes con etiquetas localizadas.

## Notas técnicas

- Fechas del heatmap/racha en hora de Colombia (UTC-5); aritmética de días en
  UTC sobre strings `YYYY-MM-DD` para evitar problemas de DST.
- La racha actual sigue "viva" si viste algo hoy **o** ayer.
- Sin cambios de esquema: todo sale de `watch_entries` y `media_items`.

## Archivos

- `src/features/stats/queries.ts` (`getActivityStats`, `getLibraryBreakdown`)
- `src/lib/genres.ts` (nuevo)
- `src/app/[locale]/(app)/stats/page.tsx` (heatmap, barras, tiles de racha)
- `src/i18n/messages/{es,en}.json`, `src/lib/changelog.ts`
