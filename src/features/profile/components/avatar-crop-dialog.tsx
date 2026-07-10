"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  busy?: boolean;
};

const OUTPUT_PX = 512;

export function AvatarCropDialog({ open, imageSrc, onCancel, onConfirm, busy }: Props) {
  const t = useTranslations("profile.crop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const pixelCropRef = useRef<Area | null>(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      pixelCropRef.current = null;
    }
  }, [open]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    pixelCropRef.current = areaPixels;
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !pixelCropRef.current) return;
    const blob = await renderCroppedImage(imageSrc, pixelCropRef.current);
    if (blob) await onConfirm(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="sm:max-w-md" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <div className="relative h-72 w-full overflow-hidden rounded-md bg-black/40">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="avatar-zoom" className="text-xs text-muted-foreground">
            {t("zoom")}
          </label>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={handleConfirm}>
            {busy ? t("saving") : t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders the cropped area of an image to a square WebP Blob.
 * Runs entirely in the browser via canvas — no server work.
 */
async function renderCroppedImage(src: string, area: Area): Promise<Blob | null> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_PX;
  canvas.height = OUTPUT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_PX, OUTPUT_PX);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.9);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
