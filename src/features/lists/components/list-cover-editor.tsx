"use client";

import { ImageUpIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { removeListCover, uploadListCover } from "../actions";
import { ALLOWED_COVER_MIME, type AllowedCoverMime, MAX_COVER_BYTES } from "../schemas";
import { ListCover } from "./list-cover";

/** Cover banner with upload / remove controls, for a list's detail page. */
export function ListCoverEditor({ listId, coverUrl }: { listId: string; coverUrl: string | null }) {
  const t = useTranslations("lists.cover");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_COVER_MIME.includes(file.type as AllowedCoverMime)) {
      toast.error(t("errorMime"));
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error(t("errorSize"));
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadListCover(listId, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeListCover(listId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("removed"));
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <ListCover coverUrl={coverUrl} seed={listId} className="h-36 w-full rounded-xl sm:h-44" />
      <div className="absolute right-2 bottom-2 flex gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="gap-1.5"
        >
          <ImageUpIcon className="size-4" aria-hidden />
          {t("change")}
        </Button>
        {coverUrl ? (
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            disabled={isPending}
            onClick={handleRemove}
            aria-label={t("remove")}
          >
            <Trash2Icon className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
