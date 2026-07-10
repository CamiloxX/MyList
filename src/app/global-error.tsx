"use client";

import "./globals.css";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// global-error replaces the root layout entirely: it must render its own
// <html>/<body>, import globals.css itself, and it runs OUTSIDE
// NextIntlClientProvider. The tiny inline dictionary below is the sanctioned
// exception to the "UI text always via i18n" rule — next-intl simply cannot
// reach this boundary (see docs/034-error-boundaries.md).
const COPY = {
  es: {
    title: "Algo salió mal",
    description: "Ocurrió un error inesperado. Vuelve a intentarlo.",
    retry: "Reintentar",
  },
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    retry: "Try again",
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  // Rendered client-side only (after an error escaped the root layout), so
  // reading the locale from the URL is safe; default to Spanish.
  const locale =
    typeof window !== "undefined" && window.location.pathname.split("/")[1] === "en" ? "en" : "es";
  const t = COPY[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground antialiased">
        <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">{t.title}</p>
          <p className="text-sm text-muted-foreground">{t.description}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
