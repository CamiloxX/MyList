"use client";

import { UserPenIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { updateDisplayName } from "../actions";
import { DISPLAY_NAME_MAX } from "../schemas";

type Props = {
  currentName: string;
  /** ISO date when the user may change the name again, or null if changeable now. */
  nextChangeAt: string | null;
};

export function DisplayNameCard({ currentName, nextChangeAt }: Props) {
  const t = useTranslations("settings.profileName");
  const format = useFormatter();
  const router = useRouter();
  const [value, setValue] = useState(currentName);
  const [lockedUntil, setLockedUntil] = useState<string | null>(nextChangeAt);
  const [isPending, startTransition] = useTransition();

  const locked = lockedUntil !== null && new Date(lockedUntil).getTime() > Date.now();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    startTransition(async () => {
      const result = await updateDisplayName({ displayName: value });
      if (result.ok) {
        toast.success(t("successToast"));
        setValue(result.displayName);
        setLockedUntil(result.nextChangeAt);
        router.refresh();
        return;
      }
      if (result.errorKey === "tooSoon" && result.nextChangeAt) {
        setLockedUntil(result.nextChangeAt);
      }
      toast.error(t(`errors.${result.errorKey}`));
    });
  };

  const unchanged = value.trim() === currentName.trim();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t("label")}</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          maxLength={DISPLAY_NAME_MAX}
          value={value}
          disabled={locked || isPending}
          onChange={(e) => setValue(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {locked && lockedUntil
            ? t("lockedHint", {
                date: format.dateTime(new Date(lockedUntil), { dateStyle: "long" }),
              })
            : t("freeHint")}
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={locked || isPending || unchanged} className="gap-1.5">
          <UserPenIcon className="size-4" aria-hidden />
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
