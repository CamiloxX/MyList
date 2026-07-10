"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/** Boundary for public routes (home, /u/[username], /share/[id]). */
export default function LocaleError({
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
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <ErrorState reset={reset} />
    </div>
  );
}
