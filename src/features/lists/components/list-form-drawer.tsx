"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { createList, updateList } from "../actions";
import { LIST_DESCRIPTION_MAX, LIST_NAME_MAX } from "../schemas";

type EditTarget = { id: string; name: string; description: string | null };

/**
 * Controlled bottom-sheet form to create a new list or edit an existing one
 * (pass `list` for edit mode). Used by CreateListButton and ListSettings.
 */
export function ListFormDrawer({
  open,
  onOpenChange,
  list,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: EditTarget;
}) {
  const t = useTranslations("lists");
  const router = useRouter();
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [isPending, startTransition] = useTransition();

  // Seed the fields whenever the sheet opens (handles reuse across lists).
  useEffect(() => {
    if (open) {
      setName(list?.name ?? "");
      setDescription(list?.description ?? "");
    }
  }, [open, list]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = { name, description };
      const result = list ? await updateList(list.id, payload) : await createList(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(list ? t("updated") : t("created"));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{list ? t("editTitle") : t("createTitle")}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="flex flex-col gap-3 px-4 pb-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={LIST_NAME_MAX}
            // biome-ignore lint/a11y/noAutofocus: the form is the sole purpose of the sheet
            autoFocus
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            maxLength={LIST_DESCRIPTION_MAX}
            rows={3}
          />
          <Button type="submit" disabled={isPending || name.trim() === ""}>
            {isPending ? t("saving") : list ? t("save") : t("create")}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
