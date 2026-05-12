"use client";

import {
  BookmarkIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  type LucideIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useNotifyBadges } from "@/features/badges/notify";
import { cn } from "@/lib/utils";
import { updateLibraryStatus } from "../actions";
import { type MediaStatus, STATUS_OPTIONS } from "../status";

const STATUS_ICONS: Record<MediaStatus, LucideIcon> = {
  watching: EyeIcon,
  watched: CheckCircle2Icon,
  pending: BookmarkIcon,
  dropped: XCircleIcon,
};

const STATUS_ACCENT: Record<MediaStatus, string> = {
  watching: "text-sky-500 dark:text-sky-400",
  watched: "text-emerald-500 dark:text-emerald-400",
  pending: "text-amber-500 dark:text-amber-400",
  dropped: "text-rose-500 dark:text-rose-400",
};

/**
 * Status picker rendered as a button + bottom-sheet of options. The native
 * Select dropdown was hard to target on mobile; the sheet gives every option
 * a full-width tappable row with its accent color.
 */
export function StatusSelect({ id, current }: { id: string; current: MediaStatus }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("statuses");
  const tStatus = useTranslations("library.status");
  const notifyBadges = useNotifyBadges();

  const handleSelect = (next: MediaStatus) => {
    if (next === current) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await updateLibraryStatus(id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.newBadges?.length) notifyBadges(result.newBadges);
      setOpen(false);
    });
  };

  const CurrentIcon = STATUS_ICONS[current];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="gap-2"
          />
        }
      >
        <CurrentIcon
          className={cn("size-4 shrink-0", STATUS_ACCENT[current])}
          aria-hidden
        />
        <span>{t(current)}</span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tStatus("pickLabel")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 pb-1">
          {STATUS_OPTIONS.map((option) => {
            const Icon = STATUS_ICONS[option.value];
            const isSelected = option.value === current;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={isPending}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent active:bg-accent",
                  isPending && "opacity-60",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    isSelected ? "text-primary" : STATUS_ACCENT[option.value],
                  )}
                  aria-hidden
                />
                <span className="flex-1 text-sm font-medium">{t(option.value)}</span>
                {isSelected ? (
                  <CheckIcon className="size-4 text-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
