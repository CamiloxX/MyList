"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Boundary for every route inside the app shell. It renders within the
 * (app) layout, so the sidebar/header stay alive and the user can navigate
 * away even when a page crashes.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6">
      <ErrorState reset={reset} showHomeLink />
    </div>
  );
}
