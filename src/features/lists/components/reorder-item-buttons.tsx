"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { moveListItem } from "../actions";

/** Up/down controls to reorder a title within a list (touch-friendly). */
export function ReorderItemButtons({
  listId,
  mediaItemId,
  isFirst,
  isLast,
}: {
  listId: string;
  mediaItemId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const move = (direction: "up" | "down") => {
    startTransition(async () => {
      const result = await moveListItem(listId, mediaItemId, direction);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isPending || isFirst}
        onClick={() => move("up")}
        aria-label={t("moveUp")}
        className="text-muted-foreground"
      >
        <ChevronUpIcon className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={isPending || isLast}
        onClick={() => move("down")}
        aria-label={t("moveDown")}
        className="text-muted-foreground"
      >
        <ChevronDownIcon className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
