"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotifyBadges } from "@/features/badges/notify";
import { addToLibrary } from "../actions";
import type { AddToLibraryInput } from "../schemas";

export function AddToLibraryButton(props: AddToLibraryInput) {
  const t = useTranslations("library.addToLibrary");
  const notifyBadges = useNotifyBadges();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    startTransition(async () => {
      const result = await addToLibrary(props);
      if (result.ok) {
        setAdded(true);
        toast.success(t("successToast"));
        if (result.newBadges?.length) notifyBadges(result.newBadges);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button size="sm" onClick={handleClick} disabled={isPending || added}>
      {added ? t("added") : isPending ? t("adding") : t("add")}
    </Button>
  );
}
