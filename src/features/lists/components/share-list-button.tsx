"use client";

import { GlobeIcon, LinkIcon, LockIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { type ListVisibility, setListVisibility } from "../actions";

/**
 * Share control with three visibility states:
 * - `private`: not shared. First tap makes it `unlisted` and copies the link.
 * - `unlisted`: anyone with the link. Popover offers copy / make public / stop.
 * - `public`: also shown in the Discover feed.
 */
export function ShareListButton({
  listId,
  listName,
  initialVisibility,
}: {
  listId: string;
  listName: string;
  initialVisibility: ListVisibility;
}) {
  const t = useTranslations("lists.share");
  const locale = useLocale();
  const router = useRouter();
  const [visibility, setVisibility] = useState<ListVisibility>(initialVisibility);
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

  const changeVisibility = (next: ListVisibility, after?: () => void | Promise<void>) => {
    startTransition(async () => {
      const result = await setListVisibility(listId, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setVisibility(next);
      await after?.();
      router.refresh();
    });
  };

  if (visibility === "private") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={() => changeVisibility("unlisted", () => shareOrCopy(listName))}
      >
        <Share2Icon className="size-4" aria-hidden />
        {t("button")}
      </Button>
    );
  }

  const isPublic = visibility === "public";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5")}
      >
        {isPublic ? (
          <GlobeIcon className="size-4" aria-hidden />
        ) : (
          <Share2Icon className="size-4" aria-hidden />
        )}
        {t("button")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
          {isPublic ? t("publicHint") : t("sharedHint")}
        </p>
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
          disabled={isPending}
          onClick={() => changeVisibility(isPublic ? "unlisted" : "public")}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          <GlobeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {isPublic ? t("makeUnlisted") : t("makePublic")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            changeVisibility("private", () => {
              setOpen(false);
              toast.success(t("stopped"));
            })
          }
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <LockIcon className="size-4 shrink-0" aria-hidden />
          {t("stop")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
