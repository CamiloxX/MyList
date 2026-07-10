"use client";

import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { usePathname, useRouter } from "@/i18n/navigation";
import { WatchEntryForm } from "./watch-entry-form";

/**
 * Mounts the WatchEntryForm inside a bottom-sheet drawer behind a single
 * "+ Registrar visualización" button. On mobile the form was bolted to the
 * bottom of the detail page and forced a long scroll — this gives it a
 * dedicated surface only when the user actually wants to log something.
 */
export function WatchEntryTrigger({
  mediaItemId,
  defaultOpen = false,
}: {
  mediaItemId: string;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("library.watchEntry");
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("log")) {
        params.delete("log");
        const nextQuery = params.toString();
        router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`);
      }
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger render={<Button type="button" size="lg" className="w-full gap-2 sm:w-auto" />}>
        <PlusIcon className="size-4" aria-hidden />
        {t("addCta")}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto pb-2">
          <WatchEntryForm mediaItemId={mediaItemId} onSuccess={() => handleOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
