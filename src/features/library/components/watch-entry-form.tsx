"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useNotifyBadges } from "@/features/badges/notify";
import { todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { addWatchEntry } from "../actions";
import { PLATFORMS, type WatchEntryInput, watchEntrySchema } from "../schemas";
import { PlatformIcon } from "./platform-icon";
import { StarRating } from "./star-rating";

export function WatchEntryForm({
  mediaItemId,
  onSuccess,
}: {
  mediaItemId: string;
  /** Optional hook fired after a successful save — used by the drawer wrapper to dismiss itself. */
  onSuccess?: () => void;
}) {
  const t = useTranslations("library.watchEntry");
  const tCommon = useTranslations("common");
  const tPlatforms = useTranslations("platforms");
  const notifyBadges = useNotifyBadges();
  const [isPending, startTransition] = useTransition();
  const [platformSelection, setPlatformSelection] = useState<string>("Netflix");
  const [otherPlatform, setOtherPlatform] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<WatchEntryInput>({
    resolver: zodResolver(watchEntrySchema),
    defaultValues: {
      mediaItemId,
      watchedOn: todayIso(),
      rating: null,
      platform: "Netflix",
      notes: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const platform =
      platformSelection === "Otra" ? otherPlatform.trim() || null : platformSelection || null;
    startTransition(async () => {
      const result = await addWatchEntry({
        ...values,
        platform,
        rating: values.rating ?? null,
        notes: values.notes?.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("successToast"));
      if (result.newBadges?.length) notifyBadges(result.newBadges);
      reset({
        mediaItemId,
        watchedOn: todayIso(),
        rating: null,
        platform: "Netflix",
        notes: "",
      });
      setPlatformSelection("Netflix");
      setOtherPlatform("");
      onSuccess?.();
    });
  });

  // When `onSuccess` is provided we assume the form is embedded inside a Drawer
  // (the drawer renders its own title + chrome), so we drop the card wrapper
  // and the duplicated heading. Otherwise we keep the standalone card look.
  const isEmbedded = Boolean(onSuccess);

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-4", !isEmbedded && "rounded-xl border bg-card p-4")}
    >
      {isEmbedded ? null : <h3 className="text-base font-medium">{t("title")}</h3>}

      <input type="hidden" {...register("mediaItemId")} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="watchedOn">{t("date")}</Label>
        <Controller
          control={control}
          name="watchedOn"
          render={({ field }) => (
            <DatePicker
              id="watchedOn"
              value={field.value ?? ""}
              onChange={(iso) => field.onChange(iso)}
              ariaInvalid={Boolean(errors.watchedOn)}
            />
          )}
        />
        {errors.watchedOn ? (
          <p className="text-xs text-destructive">{errors.watchedOn.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("rating")}</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRating
              value={field.value ?? null}
              onChange={(next) => field.onChange(next)}
              ariaLabel={t("ratingAriaLabel")}
            />
          )}
        />
        {errors.rating ? <p className="text-xs text-destructive">{errors.rating.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("platform")}</Label>
        <Select
          value={platformSelection}
          onValueChange={(value) => {
            if (value) setPlatformSelection(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>
              <PlatformIcon platform={platformSelection} size="sm" />
              <span>{tPlatforms(platformSelection as "Netflix")}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                <PlatformIcon platform={platform} size="sm" />
                <span>{tPlatforms(platform)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {platformSelection === "Otra" ? (
          <Input
            placeholder={t("otherPlaceholder")}
            value={otherPlatform}
            onChange={(event) => setOtherPlatform(event.target.value)}
            className="mt-2"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" placeholder={tCommon("optional")} rows={3} {...register("notes")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
