"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BadgeDefinition, BadgeTier } from "../types";
import { BadgeIcon } from "./badge-icon";

const TIER_GRADIENT: Record<BadgeTier, string> = {
  bronze: "from-amber-400 via-orange-500 to-amber-700",
  silver: "from-slate-200 via-slate-400 to-slate-600",
  gold: "from-yellow-300 via-amber-400 to-yellow-600",
};

const TIER_GLOW: Record<BadgeTier, string> = {
  bronze: "shadow-amber-500/50",
  silver: "shadow-slate-300/40",
  gold: "shadow-yellow-400/60",
};

const TIER_RING: Record<BadgeTier, string> = {
  bronze: "ring-amber-400/40",
  silver: "ring-slate-300/40",
  gold: "ring-yellow-300/50",
};

const AUTO_DISMISS_MS = 4500;

export function BadgeUnlockOverlay({
  badge,
  onDismiss,
}: {
  badge: BadgeDefinition;
  onDismiss: () => void;
}) {
  const t = useTranslations("badges");
  const [leaving, setLeaving] = useState(false);
  const closingRef = useRef(false);

  // Coordinated exit: trigger the leave animation, then unmount.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setLeaving(true);
    window.setTimeout(onDismiss, 220);
  }, [onDismiss]);

  useEffect(() => {
    const autoCloseId = window.setTimeout(requestClose, AUTO_DISMISS_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(autoCloseId);
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose]);

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={t(`items.${badge.i18nKey}.name`)}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        leaving
          ? "animate-out fade-out duration-200"
          : "animate-in fade-in duration-300",
      )}
    >
      <button
        type="button"
        aria-label={t("dismissHint")}
        onClick={requestClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <button
        type="button"
        onClick={requestClose}
        className={cn(
          "relative flex max-w-sm cursor-pointer flex-col items-center gap-5 rounded-3xl border bg-card p-8 text-center shadow-2xl",
          leaving
            ? "animate-out zoom-out-95 fade-out duration-200"
            : "animate-in zoom-in-50 slide-in-from-bottom-8 fade-in duration-500",
        )}
      >
        {/* Pulsing aura behind the medal */}
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-12 size-40 -translate-x-1/2 rounded-full bg-gradient-to-br opacity-40 blur-2xl animate-pulse",
            TIER_GRADIENT[badge.tier],
          )}
          aria-hidden
        />

        {/* Medal */}
        <div
          className={cn(
            "relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-xl ring-8 ring-offset-4 ring-offset-card",
            TIER_GRADIENT[badge.tier],
            TIER_GLOW[badge.tier],
            TIER_RING[badge.tier],
          )}
        >
          <BadgeIcon iconKey={badge.iconKey} className="size-14 drop-shadow-md" />
          {/* Rotating sheen */}
          <span
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            aria-hidden
          >
            <span className="absolute -inset-1/2 animate-[mylist-shimmer_2.4s_linear_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </span>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          {t("toast.unlocked")}
        </p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          {t(`items.${badge.i18nKey}.name`)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(`items.${badge.i18nKey}.description`)}
        </p>

        <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
          {t("dismissHint")}
        </p>
      </button>
    </div>
  );
}
