import * as Sentry from "@sentry/nextjs";
import { clientEnv } from "@/lib/env/client";

// Browser-side Sentry init. Conservative on purpose: low trace sampling and
// no Session Replay (quota). Inert without a DSN, so dev needs no setup.
Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
