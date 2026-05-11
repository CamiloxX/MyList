# MyList

Webapp personal para llevar registro de películas, series y anime vistos:
biblioteca con estado y rating, vistas mensuales/anuales, estadísticas,
listas personalizadas y export.

## Stack

- **Next.js 16** (App Router) + **TypeScript estricto**
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Storage) con RLS
- **TanStack Query** + **Zod** + **React Hook Form**
- **TMDB** (pelis/series) y **AniList** (anime)
- **Biome** para lint + format
- **Vitest** (unit) y **Playwright** (e2e desde Hito 2)
- **next-intl** para i18n (`es` desde Hito 1, `en` desde Hito 3)
- **pnpm** y deploy en **Vercel**

## Requisitos

- Node.js 20+ (probado con 24)
- pnpm 11+
- Cuenta de Supabase (proyecto creado)
- API key de TMDB

## Setup local

```bash
pnpm install
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase y TMDB
pnpm dev
```

Abrir http://localhost:3000.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build |
| `pnpm typecheck` | Verifica tipos sin emitir |
| `pnpm lint` | Revisa con Biome |
| `pnpm lint:fix` | Aplica fixes seguros de Biome |
| `pnpm format` | Formatea con Biome |
| `pnpm check` | Lint + format en una sola pasada |

## Estructura

Ver `CLAUDE.md` para convenciones y estructura completa.

## Documentación de cambios

Cada cambio significativo deja una nota en `docs/`. Ver `docs/001-bootstrap.md`
para el contexto inicial.
