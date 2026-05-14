"use client";

import { ImageUpIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { removeAvatar, uploadAvatar } from "../actions";
import { ALLOWED_AVATAR_MIME, MAX_AVATAR_BYTES } from "../schemas";
import { AvatarCropDialog } from "./avatar-crop-dialog";

type Props = {
  currentAvatarUrl: string | null;
  displayName: string | null;
};

export function AvatarUploadCard({ currentAvatarUrl, displayName }: Props) {
  const t = useTranslations("profile.upload");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_AVATAR_MIME.includes(file.type as (typeof ALLOWED_AVATAR_MIME)[number])) {
      toast.error(t("errorMime"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("errorSize"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", new File([blob], "avatar.webp", { type: "image/webp" }));
      const result = await uploadAvatar(formData);
      if (result.ok) {
        toast.success(t("successToast"));
        setCropOpen(false);
        setPreviewSrc(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.ok) {
        toast.success(t("removedToast"));
        setConfirmRemove(false);
        router.refresh();
      } else {
        toast.error(result.error);
        setConfirmRemove(false);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar src={currentAvatarUrl} name={displayName} size="lg" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handlePick}
            className="gap-1.5"
          >
            <ImageUpIcon className="size-3.5" aria-hidden />
            {t("change")}
          </Button>
          {currentAvatarUrl ? (
            confirmRemove ? (
              <span className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={handleRemove}
                >
                  {t("confirmRemove")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmRemove(false)}
                >
                  {t("cancel")}
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmRemove(true)}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" aria-hidden />
                {t("remove")}
              </Button>
            )
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AVATAR_MIME.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={previewSrc}
        busy={isPending}
        onCancel={() => {
          setCropOpen(false);
          setPreviewSrc(null);
        }}
        onConfirm={handleCropConfirm}
      />
    </>
  );
}
