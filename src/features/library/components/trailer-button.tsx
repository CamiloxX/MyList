"use client";

import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Renders a "Watch trailer" button that opens a 16:9 modal with the YouTube
 * embed for the given video key. The iframe only mounts while the dialog is
 * open so navigating away cuts the video stream — no autoplay-in-background
 * once the user closes it.
 */
export function TrailerButton({ youtubeKey, title }: { youtubeKey: string; title: string }) {
  const t = useTranslations("library.trailer");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <PlayIcon className="size-4" aria-hidden />
        {t("watch")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden bg-black p-0 ring-0 sm:max-w-3xl" showCloseButton>
          <DialogTitle className="sr-only">{t("dialogTitle", { title })}</DialogTitle>
          {open ? (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                title={t("dialogTitle", { title })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
