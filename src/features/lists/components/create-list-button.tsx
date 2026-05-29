"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListFormDrawer } from "./list-form-drawer";

export function CreateListButton() {
  const t = useTranslations("lists");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" aria-hidden />
        {t("create")}
      </Button>
      <ListFormDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
