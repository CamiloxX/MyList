"use client";

import { ArrowRightIcon, DicesIcon, RotateCcwIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { pickRandomPendingMediaItem } from "../actions";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

/**
 * "¿Qué veo hoy?" — opens a drawer that picks a random pending item from
 * the user's library. Designed to kill decision paralysis when the library
 * is big and the user just wants something to commit to tonight.
 */
export function RandomPickButton() {
  const t = useTranslations("library.randomPick");
  const tKinds = useTranslations("kinds");
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<MediaItem | null>(null);
  const [emptyPool, setEmptyPool] = useState(false);
  const [isPending, startTransition] = useTransition();

  const roll = (excludeId?: string) => {
    startTransition(async () => {
      const result = await pickRandomPendingMediaItem(excludeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!result.item) {
        if (!item) {
          setEmptyPool(true);
        } else {
          toast.info(t("noMoreOptions"));
        }
        return;
      }
      setEmptyPool(false);
      setItem(result.item);
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !item) roll();
    if (!next) {
      // Reset on close so the next open re-rolls fresh.
      setItem(null);
      setEmptyPool(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger
        render={<Button type="button" size="sm" className="gap-2 rounded-full px-4" />}
      >
        <DicesIcon className="size-4" aria-hidden />
        <span>{t("trigger")}</span>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          {emptyPool ? (
            <EmptyPool />
          ) : item ? (
            <PickedItem item={item} kindLabel={tKinds(item.kind)} loading={isPending} />
          ) : (
            <PickedItemSkeleton />
          )}

          {emptyPool ? (
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
            >
              {t("goSearch")}
            </Link>
          ) : item ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/library/${item.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "flex-1 gap-2",
                )}
              >
                <ArrowRightIcon className="size-4" aria-hidden />
                {t("seeDetail")}
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => roll(item.id)}
                disabled={isPending}
                className="flex-1 gap-2"
              >
                <RotateCcwIcon
                  className={cn("size-4", isPending && "animate-spin")}
                  aria-hidden
                />
                {t("reroll")}
              </Button>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PickedItem({
  item,
  kindLabel,
  loading,
}: {
  item: MediaItem;
  kindLabel: string;
  loading: boolean;
}) {
  return (
    <div className={cn("flex gap-4 transition-opacity", loading && "opacity-60")}>
      <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md ring-1 ring-foreground/10">
        {item.poster_url ? (
          <Image
            src={item.poster_url}
            alt={item.title}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{kindLabel}</Badge>
          {item.year ? (
            <span className="text-xs text-muted-foreground">{item.year}</span>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
        {item.original_title && item.original_title !== item.title ? (
          <p className="text-xs text-muted-foreground">{item.original_title}</p>
        ) : null}
      </div>
    </div>
  );
}

function PickedItemSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="aspect-[2/3] w-24 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

function EmptyPool() {
  const t = useTranslations("library.randomPick");
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{t("empty")}</p>
    </div>
  );
}
