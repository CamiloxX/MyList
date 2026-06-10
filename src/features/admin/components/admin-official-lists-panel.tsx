"use client";

import { BadgeCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ListSummary } from "@/features/lists/queries";
import { setListOfficial } from "../actions";

/**
 * Admin tool to publish/unpublish the admin's own lists as official. Optimistic
 * per-row toggle; setListOfficial enforces the real admin gate server-side.
 */
export function AdminOfficialListsPanel({ lists }: { lists: ListSummary[] }) {
  const t = useTranslations("admin.official");
  const [officialIds, setOfficialIds] = useState<Set<string>>(
    () => new Set(lists.filter((l) => l.isOfficial).map((l) => l.id)),
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startMutate] = useTransition();

  if (lists.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("empty")}</p>;
  }

  const toggle = (list: ListSummary) => {
    const next = !officialIds.has(list.id);
    setPendingIds((prev) => new Set(prev).add(list.id));
    setOfficialIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(list.id);
      else s.delete(list.id);
      return s;
    });

    startMutate(async () => {
      const result = await setListOfficial(list.id, next);
      setPendingIds((prev) => {
        const s = new Set(prev);
        s.delete(list.id);
        return s;
      });
      if (!result.ok) {
        setOfficialIds((prev) => {
          const s = new Set(prev);
          if (next) s.delete(list.id);
          else s.add(list.id);
          return s;
        });
        toast.error(result.error);
        return;
      }
      toast.success(next ? t("markedToast") : t("unmarkedToast"));
    });
  };

  return (
    <ul className="flex flex-col gap-1">
      {lists.map((list) => {
        const isOfficial = officialIds.has(list.id);
        const pending = pendingIds.has(list.id);
        return (
          <li key={list.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate text-sm">{list.name}</span>
              {isOfficial ? (
                <BadgeCheckIcon className="size-3.5 shrink-0 text-sky-500" aria-hidden />
              ) : null}
            </span>
            <Button
              type="button"
              variant={isOfficial ? "outline" : "default"}
              size="xs"
              disabled={pending}
              onClick={() => toggle(list)}
            >
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : isOfficial ? (
                t("unmark")
              ) : (
                t("mark")
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
