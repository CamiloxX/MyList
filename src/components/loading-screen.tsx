import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional custom message; defaults to common.loading translation. */
  message?: string;
  /** Adds extra vertical spacing for full-page contexts. */
  fullScreen?: boolean;
};

/**
 * Branded loading state shown by Next.js suspense boundaries (loading.tsx).
 * Three radar-style ripples emit from behind the breathing brand mark, the
 * wordmark gets a shimmer sweep, and three bounce-staggered dots trail the
 * loading message — so even brief loads feel intentional.
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
        {/* Concentric ripples behind the logo. Three rings staggered every
            1.4s create a continuous "sonar" effect. */}
        {[0, 1.4, 2.8].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-primary/40 bg-primary/10"
            style={{
              animation: "mylist-ripple 4.2s ease-out infinite",
              animationDelay: `${delay}s`,
            }}
          />
        ))}

        {/* Soft halo so the logo always sits on a glow even between ripples. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-primary/30 blur-3xl"
        />

        {/* Wrapper carries the breathe animation since BrandMark itself
            only accepts size+className. */}
        <span
          className="relative drop-shadow-lg"
          style={{ animation: "mylist-breathe 3.6s ease-in-out infinite" }}
        >
          <BrandMark size={96} />
        </span>
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
