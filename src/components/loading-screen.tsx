import { getTranslations } from "next-intl/server";
import { LottieLoader } from "@/components/lottie/lottie-loader";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional custom message; defaults to common.loading translation. */
  message?: string;
  /** Adds extra vertical spacing for full-page contexts. */
  fullScreen?: boolean;
};

/**
 * Branded loading state shown by Next.js suspense boundaries (loading.tsx).
 * The MyList Lottie loader (orbiting purple dots) sits above the wordmark, with
 * three bounce-staggered dots trailing the loading message — so even brief
 * loads feel intentional.
 */
export async function LoadingScreen({ message, fullScreen = false }: Props) {
  const t = await getTranslations("common");
  const label = message ?? t("loading").replace(/\.\.\.$/, "");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6",
        fullScreen ? "min-h-[80vh]" : "min-h-[55vh]",
      )}
    >
      <div className="relative flex size-44 items-center justify-center">
        {/* Soft halo so the loader always sits on a subtle glow. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-primary/30 blur-3xl"
        />

        <LottieLoader size={176} className="relative drop-shadow-lg" />
      </div>

      {/* Wordmark with a slow gradient shimmer reading L→R then back. */}
      <span
        className="font-display text-3xl font-extrabold leading-none tracking-tight"
        style={{
          backgroundImage:
            "linear-gradient(110deg, var(--color-foreground) 30%, var(--color-primary) 50%, var(--color-foreground) 70%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          letterSpacing: "-0.04em",
          animation: "mylist-shimmer 3.2s linear infinite",
        }}
      >
        my<span style={{ color: "var(--color-primary)" }}>list</span>
      </span>

      <p className="text-sm text-muted-foreground">
        <span>{label}</span>
        <span aria-hidden className="ml-0.5 inline-flex gap-0.5">
          <span className="inline-block animate-bounce [animation-delay:-0.3s]">.</span>
          <span className="inline-block animate-bounce [animation-delay:-0.15s]">.</span>
          <span className="inline-block animate-bounce">.</span>
        </span>
      </p>
    </div>
  );
}
