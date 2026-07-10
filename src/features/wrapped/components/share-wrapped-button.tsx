"use client";

import { LinkIcon, LockIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createWrappedShare, revokeWrappedShare } from "../actions";

/**
 * Two-state share control (adapted from ShareListButton): not shared → first
 * tap publishes and opens the native share sheet (or copies the link);
 * shared → popover with copy / revoke.
 */
export function ShareWrappedButton({
  year,
  initialShareId,
}: {
  year: number;
  initialShareId: string | null;
}) {
  const t = useTranslations("wrapped.share");
  const locale = useLocale();
  const [shareId, setShareId] = useState<string | null>(initialShareId);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shareUrl = (id: string) => `${window.location.origin}/${locale}/wrapped/share/${id}`;

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id));
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyError"));
    }
  };

  const shareOrCopy = async (id: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("shareTitle", { year }), url: shareUrl(id) });
      } catch {
        // User dismissed the sheet — nothing else to do.
      }
      return;
    }
    await copyLink(id);
  };

  if (!shareId) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await createWrappedShare(year);
            if (!result.ok) {
              toast.error(t("failed"));
              return;
            }
            setShareId(result.data.id);
            await shareOrCopy(result.data.id);
          })
        }
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
          onClick={() => copyLink(shareId)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
        >
          <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {t("copy")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await revokeWrappedShare(year);
              if (!result.ok) {
                toast.error(t("failed"));
                return;
              }
              setShareId(null);
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
