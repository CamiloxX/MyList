"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { WatchEntryForm } from "./watch-entry-form";

/**
 * Mounts the WatchEntryForm inside a bottom-sheet drawer behind a single
 * "+ Registrar visualización" button. On mobile the form was bolted to the
 * bottom of the detail page and forced a long scroll — this gives it a
 * dedicated surface only when the user actually wants to log something.
 */
export function WatchEntryTrigger({ mediaItemId }: { mediaItemId: string }) {
  const t = useTranslations("library.watchEntry");
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={<Button type="button" size="lg" className="w-full gap-2 sm:w-auto" />}
      >
        <PlusIcon className="size-4" aria-hidden />
        {t("addCta")}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto pb-2">
          <WatchEntryForm mediaItemId={mediaItemId} onSuccess={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
