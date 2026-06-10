"use client";

import { BadgeCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setListOfficial } from "@/features/admin/actions";

/**
 * Admin-only control on a list's detail page to publish it as an official list
 * (or unpublish it). Optimistic; the real authority is the setListOfficial
 * action's requireAdmin() gate plus the is_official DB trigger.
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
    <Button
      type="button"
      variant={official ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={pending}
      className="gap-1.5"
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : (
        <BadgeCheckIcon className="size-4" aria-hidden />
      )}
      {official ? t("unmark") : t("mark")}
    </Button>
  );
}
