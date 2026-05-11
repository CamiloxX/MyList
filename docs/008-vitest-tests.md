# 008 — Vitest setup + tests críticos

**Fecha:** 2026-05-10
**Hito:** 1
**Tarea:** 12

## Qué se hizo

### Setup Vitest

- Dependencias devDeps: `vitest`, `@vitejs/plugin-react`, `jsdom`,
  `vite-tsconfig-paths` (este último al final no se usa — Vitest 4 resuelve
  paths via `resolve.alias` directo).
- `vitest.config.ts`:
  - Plugin React (por si llegan tests de componentes).
  - Alias `@/* → src/*` y stub de `server-only` apuntando a un módulo
    vacío en `tests/__mocks__/server-only.ts`. Sin esto, importar cualquier
    archivo con `import "server-only"` revienta los tests.
  - `test.env` con valores falsos de `NEXT_PUBLIC_SUPABASE_URL`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `TMDB_API_KEY`. Esto evita que
    `src/lib/env/*.ts` (que valida al importar) crashee cuando una cadena
    de imports lo carga indirectamente.
  - Environment `node` (no `jsdom`) porque todo lo testeado es lógica pura.
- Scripts en `package.json`:
  - `pnpm test` → `vitest run`
  - `pnpm test:watch` → `vitest`

### Tests escritos

`tests/unit/schemas.test.ts` (Zod schemas — 19 tests):
- `loginSchema`: email válido, email malformado rechazado, password vacía
  rechazada.
- `registerSchema`: payload completo, password <8 rechazada, displayName
  >50 rechazado, displayName vacío rechazado.
- `addToLibrarySchema`: payload mínimo, default de `genres`, géneros como
  string o number, `kind`/`source` inválidos rechazados.
- `watchEntrySchema`: payload mínimo, fecha en formato no-ISO rechazada,
  UUID inválido rechazado, rating 1-10 aceptado, rating fuera de rango
  rechazado, rating fraccional rechazado, rating null aceptado, notes
  >2000 chars rechazado.
- `PLATFORMS`: contiene Netflix, Cine, y "Otra" como último elemento.

`tests/unit/dates.test.ts` (date helpers — 16 tests):
- `todayIso()`, `currentYearMonth()` con `vi.useFakeTimers()` para
  determinismo.
- `parseYearMonth()`: válido, varios inputs inválidos retornan null.
- `yearMonthRange()`: rango correcto, rollover de diciembre, inválido.
- `formatYearMonth()`: capitalización en español ("Mayo 2026").
- `shiftYearMonth()`: shifts +/-, cross-year, multi-month.
- `formatWatchedOn()`: formato en español, fallback en inválido.

`tests/unit/tmdb.test.ts` (TMDB helpers — 10 tests):
- `tmdbImage()`: null en path vacío, URL CDN con tamaño default, override
  de tamaño (`w500`, `original`).
- `tmdbTitle()` / `tmdbOriginalTitle()`: movie usa `title`, tv usa `name`.
- `tmdbYear()`: extrae año de `release_date` o `first_air_date`, null si
  falta fecha.

**Total: 45 tests pasando en 3 archivos.**

## Por qué

- **Tests de lógica pura primero**: Los schemas Zod y date utils son
  el núcleo no-trivial, y son donde más fácil se cuela un bug silencioso
  (validaciones que aceptan basura, dates con bugs de zona horaria).
  Componentes y server actions tienen menos lógica densa.
- **`test.env` en lugar de mock de `env.ts`**: más simple. Los validadores
  Zod siguen corriendo en test, así que si rompemos el schema de env, el
  test suite también lo detecta.
- **Stub `server-only`**: imitar el comportamiento real (lanzar) en tests
  haría imposible probar cualquier archivo server-side. El stub es lo
  estándar en proyectos Next + Vitest.
- **Sin React Testing Library en este hito**: los tests de componentes
  vienen en Hito 2 con Playwright (e2e). Para Hito 1, lo pure-functional
  es suficiente cobertura.

## Verificación

```
$ pnpm test
 Test Files  3 passed (3)
      Tests  45 passed (45)
```
- `pnpm typecheck` ✓
- `pnpm check` ✓ — 67 archivos limpios

## Pendiente

- **Tarea 13**: Deploy a Vercel. Necesita:
  - `git init` + repo en GitHub (o GitLab)
  - Cuenta Vercel + conectar el repo
  - Configurar env vars en Vercel
  - Verificar build deployado y URL pública
