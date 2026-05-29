"use client";

import { LinkIcon, LockIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { setListShared } from "../actions";

/**
 * Share-by-link control. Off by default: the first tap makes the list
 * `unlisted` and copies the public link. Once shared, a popover offers copy
 * link / stop sharing.
 */
export function ShareListButton({
  listId,
  listName,
  initialShared,
}: {
  listId: string;
  listName: string;
  initialShared: boolean;
}) {
  const t = useTranslations("lists.share");
  const locale = useLocale();
  const router = useRouter();
  const [shared, setShared] = useState(initialShared);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shareUrl = () => `${window.location.origin}/${locale}/share/${listId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyError"));
    }
  };

  // Prefer the native share sheet on mobile; fall back to copying the link.
  const shareOrCopy = async (title: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: shareUrl() });
      } catch {
        // User dismissed the sheet (or it failed) — nothing else to do.
      }
      return;
    }
    await copyLink();
  };

  const enableAndShare = (title: string) => {
    startTransition(async () => {
      const result = await setListShared(listId, true);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShared(true);
      await shareOrCopy(title);
      router.refresh();
    });
  };

  const stopSharing = () => {
    startTransition(async () => {
      const result = await setListShared(listId, false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShared(false);
      setOpen(false);
      toast.success(t("stopped"));
      router.refresh();
    });
  };

  if (!shared) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={() => enableAndShare(listName)}
      >
        <Share2Icon className="size-4" aria-hidden />
        {t("button")}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5")}
      >
        <Share2Icon className="size-4" aria-hidden />
        {t("button")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">{t("sharedHint")}</p>
        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {t("copy")}
        </button>
        <button
          type="button"
          onClick={stopSharing}
          disabled={isPending}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LockIcon className="size-4 shrink-0" aria-hidden />
          {t("stop")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
