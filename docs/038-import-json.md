# 038 — Import de biblioteca desde el JSON canónico

## Qué se hizo

La contraparte del export (que ya lo anticipaba en un comentario). En
Ajustes, junto a Exportar: elegir archivo → **Analizar** (dry-run con preview
exacta) → política Fusionar/Omitir → **Importar ahora** → resumen final.

### Export versionado (prerequisito)

`ExportPayload` gana `format_version: 1` y `ExportMediaItem` gana
`episodes_watched` (sin él no se podía restaurar el progreso de anime). El
schema de import trata ambos como opcionales → **los exports viejos siguen
siendo importables**.

### Piezas

- `src/features/import/schemas.ts` — **client-safe** (sin `server-only`; el
  preview se parsea en el navegador). Espejo del export con límites duros
  (10k items / 50k entries / strings acotados / `source_id` solo dígitos,
  misma protección anti-inyección que `addToLibrarySchema`). Acepta
  `source: "mal"` normalizándolo a `"anilist"` (previsión para el import
  externo futuro).
- `src/features/import/actions.ts` — `importLibrary(payload, { dryRun, policy })`
  Result-style. Flujo: auth → Zod en servidor → carga la biblioteca actual
  **paginada** con `fetchAllRows` (nuevo helper `src/lib/supabase/fetch-all.ts`
  que salta el tope de ~1000 filas de PostgREST) → clasifica → escribe en
  lotes de 500.
- `src/features/import/components/import-card.tsx` + sección en Ajustes.
- `next.config.ts`: `serverActions.bodySizeLimit: "5mb"` (el default de 1 MB
  rechazaba bibliotecas medianas).

## Decisiones de diseño

- **Idempotencia por contenido, no por uuid**. El plan original preservaba los
  uuid exportados, pero eso rompe el caso "exporto de la cuenta A e importo en
  la cuenta B del mismo servidor" (colisión de PK global). En su lugar:
  - Items: upsert sobre la clave lógica `unique(user_id, source, source_id, kind)`
    con `ignoreDuplicates` → retry-safe.
  - Entries: clave de contenido `(título, fecha, temporada, rating, plataforma,
    notas)` deduplicada contra la BD **y dentro del propio archivo**.
  - Resultado: re-importar el mismo archivo produce 0 duplicados, y un import
    a medio fallar se completa re-ejecutándolo.
- **Merge nunca borra**: actualiza `status` solo si el archivo es más reciente
  (`updated_at`), rellena únicamente campos vacíos y usa
  `episodes_watched = max(ambos)`.
- Entradas cuyo `media_item_id` no está en el archivo se descartan con
  contador de warnings.
- Al final de un import real: `evaluateAndPersist` de badges una sola vez +
  revalidate de /library, /stats, /month, /year.

## Verificación

`tests/e2e/import.spec.ts` (Playwright): sube un export sintético de 2 títulos
+ 2 visualizaciones vía la UI real, verifica preview → import → títulos en la
biblioteca → **re-import = "0 títulos nuevos" + "2 duplicadas"**.

## Backlog (decidido, fuera de alcance)

Import externo: MyAnimeList XML (mapeo directo por mal_id vía Jikan) y
Letterboxd CSV (búsqueda TMDB + cola de revisión manual) — parsers en cliente
que convierten al payload canónico y reutilizan esta misma server action.
