import * as Sentry from "@sentry/nextjs";

// Loaded from src/instrumentation.ts when NEXT_RUNTIME === "nodejs".
// Without a DSN the SDK is inert, so local dev needs no setup.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});
