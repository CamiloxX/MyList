# 004 — Foro y comentarios por título

## Qué se hizo

Se agregó una capa social a MyList:

1. **Foro general** en `/forum` con categorías → hilos → posts.
2. **Comentarios por título** en `/library/[id]`, atados al identificador
   global `(source, source_id, kind)` — todos los usuarios que vean un título
   con el mismo identificador comparten la misma conversación.
3. **Rol de admin** (`profiles.is_admin`) para moderar.

## Por qué

El usuario pidió una sección tipo Invision Power Board pero más liviana, donde
la gente pueda interactuar. La idea no es competir con un foro masivo; es
habilitar conversación dentro de una app que hoy es solo tracker personal.

Decisiones tomadas con el usuario antes de implementar:

- **Foro + comentarios por título**, ambos.
- **Lista plana** en hilos y comentarios (sin replies anidadas).
- **Reacción única "like"** (no múltiples emojis).
- **Visibilidad pública read-only** a nivel de RLS: el `select` policy de
  todas las tablas del foro usa `using (true)` para que un visitante anónimo
  pueda leer. La escritura sigue requiriendo `auth.uid()`.
- **Markdown** aprobado: `react-markdown` + `remark-gfm` + `rehype-sanitize`
  para evitar XSS.

## Limitación conocida v1: UI logueada-only

Aunque la RLS permite lectura anónima, las rutas del foro y `/library/[id]`
viven dentro del route group `(app)/` cuyo layout (`src/app/[locale]/(app)/layout.tsx`)
redirige a `/login` si no hay sesión. Esto se mantuvo así para no refactorizar
el layout en este hito.

La RLS está diseñada para una migración futura a un route group `(public)/`
sin cambios de schema: cuando se quiera abrir el foro al público (SEO,
landing, etc.), basta con mover las rutas.

## Schema (migración 004)

- `forum_categories` — admin-managed, slug + name + description.
- `forum_threads` — categoría, autor, título, pinned, locked, reply_count,
  last_post_at. Índice compuesto `(category_id, pinned desc, last_post_at desc)`.
- `forum_posts` — body markdown (1..10000 chars), edited_at, deleted_at.
- `forum_reactions` — PK `(post_id, user_id)`. Solo "like" (no se modela tipo).
- `title_comments` — body markdown (1..4000 chars), atado a `(source, source_id, kind)`.
- `profiles.is_admin boolean default false` — nueva columna.

Funciones/triggers nuevos:

- `public.is_admin(uuid) returns boolean` — `security definer`, usada por
  las policies para evitar joins en cada check.
- `forum_posts_bump_thread` — `after insert on forum_posts`, actualiza
  `reply_count` y `last_post_at` en el hilo padre.

## RLS resumen

| Tabla | select | insert | update | delete |
|---|---|---|---|---|
| forum_categories | `true` | admin | admin | admin |
| forum_threads | `true` | owner | owner ∨ admin | owner ∨ admin |
| forum_posts | `true` | owner (+ thread no lockeado o admin) | owner | owner ∨ admin |
| forum_reactions | `true` | self | — | self |
| title_comments | `true` | owner | owner | owner ∨ admin |

## Cómo nombrarme admin

Tras aplicar la migración, ejecutar en el SQL editor de Supabase:

```sql
update public.profiles
set is_admin = true
where id = '<tu-uuid>';
```

Para descubrir tu uuid: `select id, display_name from public.profiles;`.

## Archivos clave

- Migración: `supabase/migrations/004_forum_and_comments.sql`
- Seed: `supabase/seed.sql` (5 categorías por defecto)
- Módulo foro: `src/features/forum/`
- Módulo comentarios: `src/features/title-comments/`
- Markdown compartido: `src/components/markdown.tsx`
- Rutas: `src/app/[locale]/(app)/forum/`
- Integración detalle: `src/app/[locale]/(app)/library/[id]/page.tsx`
- Nav: `src/features/shell/components/bottom-nav.tsx` y `src/app/[locale]/(app)/layout.tsx`
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`
- Tipos: `src/types/database.ts` (ampliado a mano hasta regenerar)

## Pendiente / siguientes pasos

- Abrir foro al público sin login (mover a route group `(public)/`).
- Notificaciones en hilo (Supabase Realtime).
- Menciones `@usuario` con autocompletado.
- Imágenes en posts (Supabase Storage).
- Búsqueda full-text en posts/comentarios.
- Moderación: razón al borrar, ban temporal, reportes.
