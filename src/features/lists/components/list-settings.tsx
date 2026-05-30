"use client";

import { CopyIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { deleteList, duplicateList } from "../actions";
import { LIST_NAME_MAX } from "../schemas";
import { ListFormDrawer } from "./list-form-drawer";

type ListInfo = { id: string; name: string; description: string | null };

/** Kebab menu on a list's detail page: rename (sheet) or delete (confirm). */
export function ListSettings({ list }: { list: ListInfo }) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteList(list.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("deleted"));
      router.push("/lists");
    });
  };

  const onDuplicate = () => {
    // Build "{name} (copy)" in i18n, trimming the base so it fits the limit.
    const suffix = t("copySuffix");
    const base = list.name.slice(0, LIST_NAME_MAX - suffix.length).trimEnd();
    startTransition(async () => {
      const result = await duplicateList(list.id, `${base}${suffix}`);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMenuOpen(false);
      toast.success(t("duplicated"));
      router.push(`/lists/${result.data.id}`);
    });
  };

  return (
    <>
      <Popover
        open={menuOpen}
        onOpenChange={(o) => {
          setMenuOpen(o);
          if (!o) setConfirmDelete(false);
        }}
      >
        <PopoverTrigger
          aria-label={t("menuLabel")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <MoreVerticalIcon className="size-4" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 p-1">
              <p className="text-sm text-muted-foreground">{t("confirmDeleteTitle")}</p>
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isPending}
                  onClick={() => setConfirmDelete(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  disabled={isPending}
                  onClick={onDelete}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <PencilIcon className="size-4 text-muted-foreground" aria-hidden />
                {t("rename")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={onDuplicate}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                <CopyIcon className="size-4 text-muted-foreground" aria-hidden />
                {t("duplicate")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2Icon className="size-4" aria-hidden />
                {t("delete")}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <ListFormDrawer open={editOpen} onOpenChange={setEditOpen} list={list} />
    </>
  );
}
