# 003 — shadcn/ui, estructura modular y env validation

**Fecha:** 2026-05-09
**Hito:** 1
**Tareas:** 3, 4, 5

## Qué se hizo

### shadcn/ui (Tailwind 4 + Base UI)

- Init con `pnpm dlx shadcn@latest init --yes --defaults --no-monorepo`. Esto
  trajo `shadcn@4.7.0` que ahora usa **Base UI** (no Radix) bajo el preset
  `base-nova`.
- El init generó `components.json` pero **no creó `src/lib/utils.ts` ni los
  design tokens en `globals.css`**. Hubo que agregarlos a mano con la plantilla
  estándar shadcn-Tailwind4 (paleta zinc/neutral, modo oscuro vía `.dark`).
- Componentes base instalados:
  - `button`, `input`, `label`, `card`, `dialog`, `select`, `sonner` (toasts),
    `skeleton`, `badge`, `field` (RHF wrapper de shadcn 4), `separator`.
- Fix manual: `field.tsx` traía un `==` que rompía la regla `noDoubleEquals`
  de Biome → cambiado a `===`.

### Estructura modular por feature

```
src/
├── features/{auth,library,search,stats,lists,export}/
├── lib/{supabase,tmdb,anilist,env,utils.ts}
├── components/ui/   # shadcn primitives
├── i18n/            # next-intl (config + messages)
└── types/           # tipos compartidos + supabase generados
supabase/migrations/
tests/{unit,e2e}/
```

### Env validation con Zod

Patrón de dos capas para no exponer secretos al cliente:

- `src/lib/env/client.ts` — solo `NEXT_PUBLIC_*` (URL Supabase, anon key).
- `src/lib/env/server.ts` — incluye `import "server-only"`, valida secretos
  (`SUPABASE_SERVICE_ROLE_KEY`, `TMDB_API_KEY`) y re-exporta también las del
  cliente.

Ambos validan en tiempo de import: si falta una var, **falla rápido al boot**
con un error claro listando qué falta.

`.env.local.example` documenta todas las vars necesarias. `.gitignore` bloquea
`.env*` pero permite los `.example`.

### Dependencias agregadas

| Paquete | Para qué |
|---|---|
| `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css` | shadcn 4 deps |
| `zod`, `server-only` | validación env |
| `react-hook-form`, `@hookform/resolvers` | formularios |
| `date-fns` | helpers de fecha (vista mensual) |
| `@tanstack/react-query` | estado servidor |
| `@supabase/supabase-js`, `@supabase/ssr` | clientes Supabase (browser + SSR) |

### Biome ajustes

- `overrides` para `src/components/ui/**`: apaga `noLabelWithoutControl`,
  `useSemanticElements` y `noArrayIndexKey` (falsos positivos en componentes
  primitive de shadcn).

### pnpm `allowBuilds`

- `sharp: true`, `unrs-resolver: true` (necesarios para imágenes y resolución
  de paths en Next).
- `msw: false` (apareció como transitive de shadcn pero no la usamos).

## Por qué

- **Base UI sobre Radix**: shadcn 4 movió la default a Base UI; es la
  dirección oficial. Para un proyecto nuevo conviene seguir el camino
  recomendado.
- **Env de dos capas**: evita que `SUPABASE_SERVICE_ROLE_KEY` se cuele en el
  bundle del cliente (`server-only` lanza error en build si pasa). Más seguro
  que un único `env.ts` global.
- **Fail-fast en env**: detectar configuración rota al boot, no en runtime
  cuando un usuario hace login.

## Verificación

- `pnpm check` → 23 archivos limpios.
- `pnpm typecheck` → sin errores.
- `pnpm build` → build exitoso.
