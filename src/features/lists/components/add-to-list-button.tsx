"use client";

import { CheckIcon, ListPlusIcon, Loader2Icon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { addItemToList, createList, loadListMemberships, removeItemFromList } from "../actions";
import type { ListMembership } from "../queries";
import { LIST_NAME_MAX } from "../schemas";

/**
 * Bottom-sheet that toggles a title's membership across the user's lists, and
 * lets them spin up a new list (which the title is added to). State is local +
 * optimistic; router.refresh keeps the rest of the app in sync.
 *
 * Pass `lists` to seed memberships (detail page already has them); omit to
 * lazy-load on first open (card usage, avoids a query per card).
 */
export function AddToListButton({
  mediaItemId,
  lists: initialLists,
  variant = "button",
}: {
  mediaItemId: string;
  lists?: ListMembership[];
  variant?: "button" | "icon";
}) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListMembership[] | null>(initialLists ?? null);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && lists === null && !loading) {
      setLoading(true);
      loadListMemberships(mediaItemId)
        .then((res) => setLists(res))
        .finally(() => setLoading(false));
    }
  };

  const setContains = (id: string, contains: boolean) =>
    setLists((prev) => (prev ? prev.map((l) => (l.id === id ? { ...l, contains } : l)) : prev));

  const toggle = (list: ListMembership) => {
    const next = !list.contains;
    setContains(list.id, next); // optimistic
    startTransition(async () => {
      const result = next
        ? await addItemToList(list.id, mediaItemId)
        : await removeItemFromList(list.id, mediaItemId);
      if (!result.ok) {
        setContains(list.id, !next);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const created = await createList({ name });
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      const added = await addItemToList(created.data.id, mediaItemId);
      if (!added.ok) {
        toast.error(added.error);
        return;
      }
      setLists((prev) => [...(prev ?? []), { id: created.data.id, name, contains: true }]);
      setNewName("");
      toast.success(t("addedToNew", { name }));
      router.refresh();
    });
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger
        render={
          variant === "icon" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("addTo")}
              className="text-muted-foreground"
            />
          ) : (
            <Button type="button" variant="outline" size="sm" className="gap-2" />
          )
        }
      >
        <ListPlusIcon className="size-4 shrink-0" aria-hidden />
        {variant === "icon" ? null : t("addTo")}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("addToTitle")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto px-2 pb-2">
          {lists === null ? (
            <div className="flex justify-center py-6">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : lists.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("noListsYet")}</p>
          ) : (
            lists.map((list) => (
              <button
                key={list.id}
                type="button"
                disabled={isPending}
                onClick={() => toggle(list)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
                aria-pressed={list.contains}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border",
                    list.contains
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input",
                  )}
                >
                  {list.contains ? <CheckIcon className="size-3.5" aria-hidden /> : null}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{list.name}</span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 border-t p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("newListPlaceholder")}
            maxLength={LIST_NAME_MAX}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                create();
              }
            }}
          />
          <Button type="button" onClick={create} disabled={isPending || newName.trim() === ""}>
            {t("create")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
