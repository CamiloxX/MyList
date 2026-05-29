"use client";

import { BellIcon, BellOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { setNotifyEpisodes } from "../actions";

/**
 * Per-title switch for new-episode push notifications. Optimistic: flips the
 * label immediately and rolls back if the server action fails.
 */
export function NotifyEpisodesToggle({ id, initial }: { id: string; initial: boolean }) {
  const t = useTranslations("library.detail.notifyEpisodes");
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setNotifyEpisodes(id, next);
      if (!result.ok) {
        setEnabled(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? t("onToast") : t("offToast"));
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={enabled ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={toggle}
      aria-pressed={enabled}
      className="gap-2"
    >
      {enabled ? (
        <BellIcon className="size-4 shrink-0" aria-hidden />
      ) : (
        <BellOffIcon className="size-4 shrink-0" aria-hidden />
      )}
      <span>{enabled ? t("on") : t("off")}</span>
    </Button>
  );
}
