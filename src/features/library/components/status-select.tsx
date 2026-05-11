"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifyBadges } from "@/features/badges/notify";
import { updateLibraryStatus } from "../actions";
import { type MediaStatus, STATUS_OPTIONS } from "../status";

export function StatusSelect({ id, current }: { id: string; current: MediaStatus }) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("statuses");
  const notifyBadges = useNotifyBadges();

  const handleChange = (next: MediaStatus | null) => {
    if (!next || next === current) return;
    startTransition(async () => {
      const result = await updateLibraryStatus(id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.newBadges?.length) notifyBadges(result.newBadges);
    });
  };

  return (
    <Select value={current} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
