"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeFromLibrary } from "../actions";

export function RemoveButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("library.remove");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        {t("button")}
      </Button>
    );
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await removeFromLibrary(id);
      if (result.ok) {
        toast.success(t("successToast", { title }));
      } else {
        toast.error(result.error);
        setConfirming(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="destructive" size="xs" onClick={handleConfirm} disabled={isPending}>
        {isPending ? t("removing") : t("confirm")}
      </Button>
      <Button variant="ghost" size="xs" onClick={() => setConfirming(false)} disabled={isPending}>
        {tCommon("cancel")}
      </Button>
    </div>
  );
}
