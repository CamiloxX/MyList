"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { GoogleGlyph } from "@/components/brand/google-glyph";
import { signInWithGoogle } from "../actions";

/**
 * "Sign in with Google" pill button styled to match the auth design:
 * white surface, subtle purple border, official multi-color Google glyph.
 */
export function GoogleButton({ label }: { label?: string }) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const text = label ?? t("auth.google.continue");

  const handleClick = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (!result.ok) {
        toast.error(t(`auth.errors.${result.errorKey}` as "auth.errors.googleConnect"));
        return;
      }
      // External navigation to Google's consent screen.
      window.location.href = result.redirectTo;
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[rgba(91,33,182,0.16)] bg-white text-sm font-semibold text-[#0F172A] shadow-xs transition-colors hover:bg-[#F8FAFC] disabled:cursor-wait disabled:opacity-80"
    >
      <GoogleGlyph size={18} />
      <span>{isPending ? t("auth.google.connecting") : text}</span>
    </button>
  );
}
