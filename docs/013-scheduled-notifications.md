# 013 — Notificaciones programadas + fix del badge Android

## Qué se hizo

### 1. Badge monocromático (ícono de la barra de estado)

En Android (S25 Ultra incluido) el ícono pequeño de la barra de estado se renderiza
como **silueta monocromática usando solo el canal alfa** — el color se ignora. Antes
pasábamos el logo a color (`/iconomylist.png`) como `badge`, así que el sistema lo
convertía en un cuadrado blanco.

- Nuevo `public/badge.png`: glyph blanco sobre transparente (checklist), 96×96.
  Generado por `scripts/generate-badge.mjs` (PNG hecho a mano con `zlib`, sin
  dependencias nuevas — no hay `sharp` en el proyecto). Reproducible con
  `node scripts/generate-badge.mjs`.
- `public/sw.js`: `badge: "/badge.png"` (antes `/iconomylist.png`). `VERSION` → `v3`.

El ícono **grande** dentro de la notificación expandida sigue a color; el blanco de la
barra de estado es comportamiento del SO y no se puede forzar a color.

### 2. Notificaciones programadas (admin)

Permite dejar una notificación lista para una fecha/hora concretas.

- **Migración** `supabase/migrations/20260528000000_scheduled_notifications.sql`:
  tabla `scheduled_notifications` (`title`, `body`, `url`, `target_user_id` NULL=todos,
  `scheduled_for`, `sent_at`, `result` jsonb, `created_by`). RLS admin-only en los 4
  verbos (gate por `profiles.is_admin`). Índice parcial sobre filas no enviadas.
- **Despachador** `src/features/notifications/dispatch.ts`: con service-role busca las
  filas vencidas (`scheduled_for <= now`, `sent_at IS NULL`), **reclama** cada una
  escribiendo `sent_at` antes de enviar (evita doble disparo si dos ticks se solapan),
  envía y guarda `result`.
- **Ruta cron** `src/app/api/cron/notifications/route.ts`: GET y POST, protegida con
  `Authorization: Bearer ${CRON_SECRET}`. Sin `CRON_SECRET` configurado responde 503
  (inerte). Trigger-agnóstica: sirve para pg_cron (Hobby) o Vercel Cron (Pro).
- **send.ts** refactor: se extrajo `deliver()` (envío + prune compartido) y se añadió
  `sendPushToUserAdmin()` (service-role) para que el cron pueda mandar a cualquier
  usuario sin sesión (RLS no lo permitiría con el cliente anónimo).
- **Acciones** (`actions.ts`): `createScheduledNotification`, `listScheduledNotifications`,
  `cancelScheduledNotification` + helper `requireAdmin()` (también reusado por el
  broadcast). 
- **UI** `ScheduledForm` en `/settings` (solo admin): formulario (título, mensaje, URL,
  fecha/hora, destinatarios todos/solo-yo) + lista con estado y cancelar.
- **i18n**: `settings.scheduled.*` en `es.json` y `en.json`.
- **middleware**: el matcher ahora excluye `/api` para que `next-intl`/redirects de
  sesión no toquen la ruta del cron.

## Por qué pg_cron y no Vercel Cron

El proyecto está en **plan Hobby de Vercel**, donde el cron corre **solo 1 vez al día**.
Supabase trae `pg_cron` gratis y corre **cada minuto**, así que se usa pg_cron + pg_net
para llamar a la ruta de Next (que es donde vive `web-push` y las VAPID). La ruta queda
agnóstica: si se sube a Pro, se le enchufa Vercel Cron sin tocar código.

## Setup pendiente (manual, una sola vez)

### a) Variable de entorno

Generar un secreto y ponerlo en Vercel (Production) **y** en `.env.local`:

```bash
# generar uno
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`CRON_SECRET=<el valor generado>`  (mínimo 16 chars; pegarlo en una sola línea).

> Recordatorio: `NEXT_PUBLIC_*` no aplica aquí; `CRON_SECRET` es solo server, no marcar
> "Sensitive" no afecta porque no es build-time.

### b) Aplicar la migración

`pnpm dlx supabase db push` (o aplicarla desde el panel de Supabase).

### c) Programar pg_cron en Supabase (SQL Editor)

Reemplazar `<TU_DOMINIO>` y `<CRON_SECRET>` por los valores reales:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'dispatch-scheduled-notifications',
  '* * * * *', -- cada minuto
  $$
  select net.http_post(
    url     := 'https://<TU_DOMINIO>/api/cron/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    )
  );
  $$
);
```

Para verificar / desprogramar:

```sql
select * from cron.job;                       -- ver jobs
select * from cron.job_run_details order by start_time desc limit 10; -- historial
select cron.unschedule('dispatch-scheduled-notifications');
```

## Probar

1. En `/settings` (como admin) → "Notificaciones programadas", crear una para dentro de
   2-3 minutos con destinatarios **"Solo mis dispositivos"**.
2. Esperar al tick del minuto; debería llegar la push y la fila pasar a "Enviada".
3. La barra de estado del S25 debe mostrar la silueta blanca limpia (no el cuadrado).
