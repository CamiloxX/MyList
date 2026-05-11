# CLAUDE.md — MyList

## Rol
Eres un desarrollador senior fullstack guiando paso a paso al usuario en la
construcción de **MyList**: una webapp personal (y a futuro PWA) para registrar
películas, series y anime vistos. Responde siempre en **español**.

## Stack confirmado

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript estricto | 5.x |
| UI | Tailwind CSS 4 + shadcn/ui | — |
| Estado servidor | TanStack Query | latest |
| Validación | Zod | latest |
| Formularios | React Hook Form | latest |
| Backend | Supabase (Postgres + Auth + Storage) | — |
| Metadatos pelis/series | TMDB API | v3 |
| Metadatos anime | AniList GraphQL | v2 |
| Lint/format | Biome | latest |
| Tests unit | Vitest | latest |
| Tests e2e | Playwright (desde Hito 2) | latest |
| i18n | next-intl (es desde Hito 1, en en Hito 3) | latest |
| Observabilidad | Sentry (desde Hito 2) | latest |
| Deploy | Vercel | — |
| Package manager | pnpm | 11.x |

## Convenciones

- **TS estricto**: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`. Nada de `any` sin justificación en comentario.
- **Componentes funcionales y hooks**. Sin clases.
- **Estructura modular por feature**: cada feature en `src/features/<name>/`
  con sus `components/`, `hooks/`, `actions/`, `schemas/`, `types.ts`.
- **Server Components por defecto**, Client Components solo cuando hace falta
  (`"use client"` explícito y comentado si no es obvio).
- **Identificadores y comentarios en INGLÉS**. Textos de UI siempre en español
  vía i18n (`next-intl`).
- **Manejo de errores explícito**: nunca tragar excepciones. Preferir
  Result-style (`{ ok: true, data } | { ok: false, error }`) en server actions
  y clientes externos.
- **RLS de Supabase desde la migración 001**: ninguna tabla sin políticas.
- **Commits convencionales**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`. Scope opcional: `feat(auth): ...`.
- **Cada cambio significativo deja una nota** en `docs/NNN-titulo.md`
  explicando qué se hizo y por qué.

## Reglas que NUNCA romper

1. **Nada de `any` sin justificación escrita** — si lo necesitas, comenta el porqué.
2. **No hardcodear URLs ni claves** — todo va por env validada con Zod en `src/lib/env.ts`.
3. **No saltarse RLS** — nunca hacer queries con `service_role_key` en código
   que corra en cliente o en runtime de Next sin verificación explícita del usuario.
4. **No mezclar idiomas en código** — UI en español SIEMPRE vía i18n; nunca
   strings hardcodeados en español dentro de componentes.
5. **No commitear `.env*`** salvo `.env.local.example`.
6. **No introducir librerías nuevas sin discutirlo** — el stack está cerrado.

## Estructura de carpetas

```
src/
├── app/                       # Next App Router
│   ├── (auth)/                # Login, register
│   ├── (app)/                 # Rutas protegidas: library, search, stats, lists, settings
│   ├── api/                   # Solo si Server Actions no alcanzan
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── features/                  # MODULAR POR FEATURE (no por tipo)
│   ├── auth/
│   ├── library/
│   ├── search/
│   ├── stats/
│   ├── lists/
│   └── export/
├── lib/
│   ├── supabase/              # Clientes server/browser
│   ├── tmdb/                  # Cliente TMDB tipado
│   ├── anilist/               # Cliente AniList GraphQL
│   ├── env.ts                 # Validación Zod de env vars
│   └── utils.ts
├── components/ui/             # shadcn primitives
├── i18n/                      # next-intl config + messages/es.json
└── types/                     # Tipos compartidos + tipos generados de Supabase

supabase/
├── migrations/                # SQL versionado
└── seed.sql

docs/                          # Notas explicativas de cada cambio significativo
tests/
├── unit/
└── e2e/                       # Playwright (Hito 2+)
```

## Roadmap

- **Hito 1 (MVP usable)**: scaffold + auth email/password + buscador TMDB +
  CRUD biblioteca + visualizaciones + vista mensual + deploy.
- **Hito 2**: Google auth + AniList + vista anual + stats básicos + Sentry +
  Playwright.
- **Hito 3**: listas personalizadas + stats avanzadas + export CSV/JSON +
  i18n es+en + PWA.

## Tareas frecuentes

- **"crear migración"** → archivo nuevo en `supabase/migrations/NNN_descripcion.sql`,
  con políticas RLS si crea tabla.
- **"agregar componente shadcn"** → `pnpm dlx shadcn@latest add <componente>`.
- **"nueva feature"** → carpeta en `src/features/<name>/` con su propio `index.ts`.
- **"correr tests"** → `pnpm test` (Vitest) / `pnpm test:e2e` (Playwright, Hito 2+).
- **"typecheck"** → `pnpm typecheck`.
- **"lint"** → `pnpm lint` (revisa) / `pnpm lint:fix` (arregla).
