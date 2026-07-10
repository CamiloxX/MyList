# 035 — Sentry: observabilidad de errores en producción

## Qué se hizo

Sentry estaba en el stack aprobado desde el Hito 2 pero nunca se implementó.
Hasta ahora los errores de producción eran invisibles.

- `pnpm add @sentry/nextjs` (v10). `@sentry/cli` aprobado en
  `pnpm-workspace.yaml` (pnpm bloquea build scripts por defecto).
- `src/instrumentation.ts` — `register()` carga la config según runtime y
  exporta `onRequestError = Sentry.captureRequestError`: **esto reporta los
  errores de Server Components, server actions y route handlers**, que los
  boundaries de cliente nunca ven.
- `src/instrumentation-client.ts` — init de navegador (DSN vía `clientEnv`,
  validado con Zod) + `onRouterTransitionStart`.
- `sentry.server.config.ts` / `sentry.edge.config.ts` en la raíz.
- `next.config.ts` envuelto con `withSentryConfig` (source maps en build).
  `tunnelRoute` queda **desactivado a propósito**: el middleware de next-intl
  reescribiría la ruta del túnel con prefijo de locale y lo rompería.
- Los 5 error boundaries ahora hacen `Sentry.captureException(error)`.

## Config conservadora

`tracesSampleRate: 0.1`, sin Session Replay (cuota), `enabled` solo en
producción. **Sin `NEXT_PUBLIC_SENTRY_DSN` el SDK queda inerte** — dev local
funciona sin configurar nada.

## Env vars (Vercel → Settings → Environment Variables)

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | **NO marcarla "Sensitive"** (NEXT_PUBLIC_ necesita build-time). Pegarla en una sola línea. |
| `SENTRY_ORG` | Slug de la organización |
| `SENTRY_PROJECT` | Slug del proyecto |
| `SENTRY_AUTH_TOKEN` | Solo build-time (source maps). Esta SÍ puede ser Sensitive. |

Sin ORG/PROJECT/AUTH_TOKEN el build solo emite un warning (no sube source maps).

## Compatibilidad

`next build --webpack`: sin problema — el plugin de source maps de Sentry es
nativo de webpack (las limitaciones históricas eran de Turbopack).

## Verificación

1. Configurar las env vars en Vercel y redeploy.
2. Provocar un error en prod (p. ej. página inexistente de servidor o un throw
   temporal) → evento en Sentry con source maps legibles y `environment:
   production`.
