# 040 — MyList Wrapped: resumen anual compartible

## Qué se hizo

**`/wrapped/[year]`** (privada, dentro del shell): pila de tarjetas estilo
Spotify Wrapped hechas a mano — hero (títulos + visualizaciones + horas),
género del año, mes más activo, mejor racha del año, top 3 mejor valorados con
pósters, y distribución de horas por tipo (reusa `KindHoursBar`). Entrada:
botón "✨ Tu Wrapped {year}" en `/stats`.

**Compartir por link público + imagen OG** (decidido con el usuario; sin
dependencias nuevas):

- Tabla `wrapped_shares` (migración `20260710000000`, aplicada vía MCP):
  `unique(user_id, year)`, RLS **owner-only** sin policy anónima — la lectura
  pública pasa por service-role gateada por la existencia de la fila (patrón
  exacto de `getSharedList`). El uuid aleatorio es la capability; revocar =
  borrar la fila → la página pública hace 404 al instante.
- `createWrappedShare` / `revokeWrappedShare` (Result-style) +
  `ShareWrappedButton` (adaptación del de listas: native share → clipboard).
- **`/wrapped/share/[id]`** (fuera del grupo `(app)`, como `/share/[id]`):
  render estático de las mismas tarjetas (`WrappedCards` compartido) + nombre
  público del autor (nunca el email) + footer "Hecho con MyList".
- **`opengraph-image.tsx`**: primera vez que el repo usa `ImageResponse` de
  `next/og` (viene con Next). PNG 1200×630 con gradiente, números grandes y el
  póster del mejor valorado — pegar el link en WhatsApp/X despliega tarjeta
  rica. Enlazado por convención de archivo.

## Datos

`getWrappedForUser(client, userId, year, locale)` sigue el patrón inyectable
`*ForUser` (el share público lo corre con service-role). Reutiliza
`getTopOfYearForUser` y `computeStreaks` (exportados en doc 039) y
`fetchAllRows` para paginación. Años sin datos → `null` → empty state.

## Verificación

`tests/e2e/wrapped.spec.ts`: siembra una visualización 2026 → `/es/wrapped/2026`
renderiza el hero → publica con el botón → **contexto anónimo** abre
`/es/wrapped/share/[id]` sin sesión → el endpoint `opengraph-image` responde
`image/png`.
