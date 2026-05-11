# 004 — Supabase: schema, RLS y clientes

**Fecha:** 2026-05-09
**Hito:** 1
**Tarea:** 6

## Qué se hizo (lado código)

### Migración 001 — Schema inicial

`supabase/migrations/001_initial_schema.sql` crea:

- **Enums**: `media_kind` (`movie`/`tv`/`anime`), `media_source`
  (`tmdb`/`anilist`), `media_status` (`watching`/`watched`/`pending`/`dropped`),
  `visibility_level` (`private`/`unlisted`/`public`).
- **Tablas**:
  - `profiles` — extiende `auth.users` (display_name, avatar, locale).
  - `media_items` — catálogo del usuario; único por (user, source, source_id,
    kind); índices por (user, status) y (user, kind).
  - `watch_entries` — cada visualización (fecha, rating 1-10, notas, plataforma);
    permite múltiples por `media_item` (re-watches).
  - `lists` + `list_items` — listas personalizadas con orden.
- **Triggers**:
  - `set_updated_at` en `profiles`, `media_items`, `lists`.
  - `handle_new_user`: cuando un usuario se registra en `auth.users`, se
    crea automáticamente su `profiles` row con un `display_name` derivado del
    email.
- **RLS** habilitada en TODAS las tablas:
  - `profiles`, `media_items`, `watch_entries`, `lists`: el dueño es el único
    que puede leer/escribir.
  - `list_items`: heredan permisos de su `list` padre.

### Clientes Supabase

| Archivo | Para qué |
|---|---|
| `src/lib/supabase/client.ts` | Browser (Client Components). Usa `createBrowserClient` de `@supabase/ssr`. |
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers. Usa `createServerClient` con cookies de Next. Incluye `createServiceRoleClient` (bypasea RLS — solo trusted server). |
| `src/lib/supabase/middleware.ts` | Refresca el JWT en cada request. Se llama desde `middleware.ts` (se agrega en el siguiente paso, junto con auth). |

`Database` está como placeholder en `src/types/database.ts`. Una vez aplicada
la migración, hay que regenerar este archivo con `supabase gen types`.

## Por qué

- **Un solo `media_items` con `source` + `source_id`**: permite mezclar TMDB y
  AniList sin tablas separadas. La unicidad por (user, source, source_id, kind)
  evita duplicados.
- **`watch_entries` separado**: pediste re-watches con historial completo, así
  cada visualización es un row con su propia fecha, rating, plataforma y notas.
- **`raw_metadata jsonb`**: guardamos lo que devuelve la API externa para no
  tener que pedirla de nuevo (y poder rehidratar campos nuevos sin migrar).
- **`handle_new_user` trigger**: garantiza que `profiles` siempre exista para
  cada `auth.users`, sin tener que recordarlo en server actions.
- **RLS estricta desde día 1**: imposible olvidarse después y tener un leak.

## Qué necesitas hacer (lado Supabase)

### Paso 1: Crear el proyecto

1. Ir a https://supabase.com → "New project".
2. Region: la más cercana a ti (probablemente `sa-east-1` para Sudamérica).
3. Anotar la contraseña del Postgres (no se muestra después).

### Paso 2: Aplicar la migración

**Opción A — Dashboard SQL Editor** (más rápido, sin CLI):

1. Project → SQL Editor → New query.
2. Pegar todo el contenido de `supabase/migrations/001_initial_schema.sql`.
3. Run. Verificar que no haya errores.

**Opción B — Supabase CLI** (recomendado a futuro para tracking):

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <tu-project-ref>
pnpm dlx supabase db push
```

### Paso 3: Tomar las credenciales

Project Settings → API:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (NUNCA al cliente)

Pegarlas en `.env.local` (copiar de `.env.local.example`).

### Paso 4: Regenerar tipos TS

Una vez aplicada la migración:

```bash
pnpm dlx supabase gen types typescript --project-id <tu-project-ref> --schema public > src/types/database.ts
```

Esto reemplaza el placeholder y nos da autocomplete + type-safety en todos
los queries.

## Verificación

- `pnpm typecheck` debe seguir verde con el placeholder de `database.ts`.
- Una vez aplicada la migración + tipos regenerados, también seguirá verde.
