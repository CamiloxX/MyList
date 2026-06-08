"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import { useRouter } from "@/i18n/navigation";
import { downscaleImageToWebp } from "@/lib/image";
import { cn } from "@/lib/utils";
import { createBadge, updateBadge, uploadBadgeIcon } from "../actions";
import type { AdminBadge } from "../queries";
import { type CreateBadgeInput, createBadgeSchema, slugifyBadgeId } from "../schemas";
import { ConditionFields } from "./condition-fields";

const TIERS = ["bronze", "silver", "gold"] as const;

const EMPTY: CreateBadgeInput = {
  id: "",
  name: "",
  description: "",
  tier: "bronze",
  sortOrder: 0,
  // Default to title_completed: it shows the TMDB/Anime source toggle, so the
  // anime search is visible up-front (title_season is TMDB-series-only).
  criterion: { kind: "title_completed", source: "tmdb", sourceId: "", mediaKind: "movie" },
};

function toFormValues(badge: AdminBadge): CreateBadgeInput {
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    tier: badge.tier,
    sortOrder: badge.sortOrder,
    criterion: badge.criterion,
  };
}

/**
 * Controlled bottom-sheet to create a badge or edit an existing one (pass
 * `badge`). On submit it writes the row, then — if a new icon was chosen —
 * uploads it. The icon upload targets the badge id, so create happens first.
 */
export function BadgeFormDrawer({
  open,
  onOpenChange,
  badge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: AdminBadge | null;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const editing = badge != null;
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const idEdited = useRef(false);
  const [iconBlob, setIconBlob] = useState<Blob | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBadgeInput>({
    resolver: zodResolver(createBadgeSchema),
    defaultValues: EMPTY,
  });

  // Reseed the form whenever the sheet opens (handles reuse across badges).
  useEffect(() => {
    if (!open) return;
    idEdited.current = editing;
    setIconBlob(null);
    setIconPreview(null);
    reset(badge ? toFormValues(badge) : EMPTY);
  }, [open, badge, editing, reset]);

  // Auto-derive the id from the name while creating, until the admin edits it.
  const nameValue = watch("name");
  useEffect(() => {
    if (!editing && !idEdited.current) {
      setValue("id", slugifyBadgeId(nameValue ?? ""));
    }
  }, [nameValue, editing, setValue]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("form.iconErrorMime"));
      return;
    }
    try {
      const blob = await downscaleImageToWebp(file, 256);
      setIconBlob(blob);
      setIconPreview(URL.createObjectURL(blob));
    } catch {
      toast.error(t("form.iconErrorProcess"));
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const targetId = editing ? badge.id : values.id;

      const result = editing
        ? await updateBadge(badge.id, {
            name: values.name,
            description: values.description,
            tier: values.tier,
            sortOrder: values.sortOrder,
            criterion: values.criterion,
          })
        : await createBadge(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      let iconFailed = false;
      if (iconBlob) {
        const formData = new FormData();
        formData.set("file", new File([iconBlob], "icon.webp", { type: "image/webp" }));
        const upload = await uploadBadgeIcon(targetId, formData);
        iconFailed = !upload.ok;
      }

      // The row saved either way; show a single, non-contradictory message —
      // a warning when only the icon failed, success otherwise.
      if (iconFailed) {
        toast.error(t("form.iconUploadFailedButSaved"));
      } else {
        toast.success(editing ? t("toast.updated") : t("toast.created"));
      }
      onOpenChange(false);
      router.refresh();
    });
  });

  const currentIconUrl = iconPreview ?? badge?.iconUrl ?? null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{editing ? t("form.editTitle") : t("form.createTitle")}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-4 pb-4">
          {/* Icon */}
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
              <BadgeIcon
                iconKey={badge?.iconKey}
                iconUrl={currentIconUrl}
                name={badge?.name ?? ""}
                className="size-9"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="gap-2"
              >
                <ImagePlusIcon className="size-4" aria-hidden />
                {t("form.icon")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("form.iconHint")}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="badge-name">{t("form.name")}</Label>
            <Input id="badge-name" {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          {/* Id (create only) */}
          {editing ? null : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="badge-id">{t("form.id")}</Label>
              <Input
                id="badge-id"
                {...register("id", { onChange: () => { idEdited.current = true; } })}
                className="font-mono text-sm"
              />
              {errors.id ? <p className="text-xs text-destructive">{errors.id.message}</p> : null}
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="badge-description">{t("form.description")}</Label>
            <Textarea id="badge-description" rows={2} {...register("description")} />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          {/* Tier */}
          <div className="flex flex-col gap-1.5">
            <Label>{t("form.tier")}</Label>
            <Controller
              control={control}
              name="tier"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {t(`tiers.${tier}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Condition */}
          <Controller
            control={control}
            name="criterion"
            render={({ field }) => (
              <ConditionFields value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.criterion ? (
            <p className="text-xs text-destructive">{t("condition.invalid")}</p>
          ) : null}

          {/* Sort order */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="badge-sort">{t("form.sortOrder")}</Label>
            <Input
              id="badge-sort"
              type="number"
              min={0}
              className="w-32"
              {...register("sortOrder", {
                // Empty/NaN → 0 so clearing the field never silently blocks
                // submit (z.number().int() would reject NaN).
                setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? 0 : Number(v)),
              })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className={cn(isPending && "gap-2")}>
              {isPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {t("form.save")}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
