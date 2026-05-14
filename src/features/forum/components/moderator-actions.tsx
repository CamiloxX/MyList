"use client";

import { LockIcon, PinIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { deleteThread, lockThread, pinThread } from "../actions";

type Props = {
  threadId: string;
  pinned: boolean;
  locked: boolean;
  categorySlug: string;
};

export function ModeratorActions({ threadId, pinned, locked, categorySlug }: Props) {
  const t = useTranslations("forum");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const togglePin = () => {
    startTransition(async () => {
      const result = await pinThread({ threadId, pinned: !pinned });
      if (!result.ok) toast.error(result.error);
    });
  };

  const toggleLock = () => {
    startTransition(async () => {
      const result = await lockThread({ threadId, locked: !locked });
      if (!result.ok) toast.error(result.error);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteThread(threadId);
      if (result.ok) {
        toast.success(t("threadDeleted"));
        router.push(`/forum/${categorySlug}`);
      } else {
        toast.error(result.error);
        setConfirmDelete(false);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/40 px-2 py-1">
      <span className="pr-1 text-xs font-medium text-muted-foreground uppercase">
        {t("modBadge")}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={isPending}
        onClick={togglePin}
      >
        <PinIcon className="size-3.5" aria-hidden />
        {pinned ? t("unpin") : t("pin")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={isPending}
        onClick={toggleLock}
      >
        {locked ? (
          <UnlockIcon className="size-3.5" aria-hidden />
        ) : (
          <LockIcon className="size-3.5" aria-hidden />
        )}
        {locked ? t("unlock") : t("lock")}
      </Button>
      {confirmDelete ? (
        <>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            disabled={isPending}
            onClick={handleDelete}
          >
            {t("confirmDelete")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={isPending}
            onClick={() => setConfirmDelete(false)}
          >
            {t("cancel")}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={isPending}
          onClick={() => setConfirmDelete(true)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" aria-hidden />
          {t("deleteThread")}
        </Button>
      )}
    </div>
  );
}
