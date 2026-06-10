"use client";

import { BadgeCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setListOfficial } from "@/features/admin/actions";
import { cn } from "@/lib/utils";

/**
 * Admin-only "Verified list" switch on a list's detail page: publishes the list
 * as official (or unpublishes it). Optimistic; the real authority is the
 * setListOfficial action's requireAdmin() gate plus the is_official DB trigger.
 */
export function OfficialListToggle({
  listId,
  initialOfficial,
}: {
  listId: string;
  initialOfficial: boolean;
}) {
  const t = useTranslations("lists.official");
  const [official, setOfficial] = useState(initialOfficial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !official;
    setOfficial(next);
    startTransition(async () => {
      const result = await setListOfficial(listId, next);
      if (!result.ok) {
        setOfficial(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? t("markedToast") : t("unmarkedToast"));
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <BadgeCheckIcon
          className={cn("size-4", official ? "text-sky-500" : "text-muted-foreground")}
          aria-hidden
        />
        {t("verified")}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={official}
        aria-label={t("verified")}
        onClick={toggle}
        disabled={pending}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
          official ? "bg-sky-500" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            official ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
