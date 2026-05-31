"use client";

import { ArrowDownUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { sortListItems } from "../actions";
import { type ListSortCriterion, LIST_SORT_CRITERIA } from "../constants";

/** "Sort by" menu on a list's detail page; persists the new order. */
export function SortListMenu({ listId }: { listId: string }) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSort = (criterion: ListSortCriterion) => {
    startTransition(async () => {
      const result = await sortListItems(listId, criterion);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("sortLabel")}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <ArrowDownUpIcon className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{t("sortLabel")}</p>
        <div className="flex flex-col">
          {LIST_SORT_CRITERIA.map((criterion) => (
            <button
              key={criterion}
              type="button"
              disabled={isPending}
              onClick={() => onSort(criterion)}
              className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
            >
              {t(`sort.${criterion}`)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
