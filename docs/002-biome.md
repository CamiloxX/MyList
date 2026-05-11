# 002 — Lint y formato con Biome

**Fecha:** 2026-05-09
**Hito:** 1

## Qué se hizo

- Instalación de `@biomejs/biome` (versión exacta, sin `^`).
- Config en `biome.json` con:
  - Formato: 2 espacios, ancho 100, comillas dobles, semicolons, trailing
    commas en todo, arrow parens siempre.
  - Linter: reglas recomendadas + `noExplicitAny: error`,
    `noConsole: warn` (permite `warn`/`error`), `useImportType`,
    `noUnusedImports/Variables: error`.
  - Parser CSS: `tailwindDirectives: true` (necesario para `@theme`,
    `@apply` de Tailwind 4).
  - Asistente: organize imports automático.
  - Respeta `.gitignore` y excluye `.next`, `node_modules`, `dist`,
    `coverage`, `next-env.d.ts`, `src/types/database.ts` (tipos generados).
- Scripts en `package.json`: `lint`, `lint:fix`, `format`, `check`.

## Por qué

- **Biome en lugar de ESLint+Prettier**: una sola herramienta, una sola
  config, ~10x más rápido. Suficiente para un proyecto Next que no necesita
  reglas custom.
- **`tailwindDirectives` activado**: Tailwind 4 usa `@theme inline { ... }`
  en `globals.css`, que sin esta opción rompe el parser CSS de Biome.
- **`useImportType: error`**: importa tipos solo como `import type`, ayuda al
  tree-shaking.
- **`noConsole: warn` permitiendo `warn/error`**: no queremos `console.log`
  olvidados, pero los warnings y errores legítimos sí van por consola.

## Verificación

- `pnpm check` → 8 archivos chequeados, sin errores ni cambios pendientes.
