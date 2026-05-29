"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { removeItemFromList } from "../actions";

/** Small "remove from this list" control on a list's item rows. */
export function RemoveFromListButton({
  listId,
  mediaItemId,
}: {
  listId: string;
  mediaItemId: string;
}) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onRemove = () => {
    startTransition(async () => {
      const result = await removeItemFromList(listId, mediaItemId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={onRemove}
      aria-label={t("removeFromList")}
      className="text-muted-foreground hover:text-destructive"
    >
      <XIcon className="size-4" aria-hidden />
    </Button>
  );
}
