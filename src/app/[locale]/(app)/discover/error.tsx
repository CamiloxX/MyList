"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Contextual boundary for Discover: the page with the most external
 * dependencies (TMDB + OMDb + Jikan), where a flaky upstream is the most
 * likely failure and a retry usually fixes it.
 */
export default function DiscoverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6">
      <ErrorState
        reset={reset}
        title={t("discoverTitle")}
        description={t("discoverDescription")}
        showHomeLink
      />
    </div>
  );
}
