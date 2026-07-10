"use client";

import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelScheduledNotification, createScheduledNotification } from "../actions";
import type { ScheduledNotification, ScheduledTarget } from "../types";

const inputClass =
  "rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

/**
 * Admin-only UI to queue notifications for a future moment and manage the
 * pending/sent list. Server actions re-check is_admin — client guarding here is
 * purely cosmetic. After every mutation we router.refresh() so the list (which
 * the parent server component fetches) re-renders with fresh data.
 */
export function ScheduledForm({ initial }: { initial: ScheduledNotification[] }) {
  const t = useTranslations("settings.scheduled");
  const format = useFormatter();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [when, setWhen] = useState("");
  const [target, setTarget] = useState<ScheduledTarget>("all");
  const [isPending, startTransition] = useTransition();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !when) {
      toast.error(t("errors.required"));
      return;
    }
    // datetime-local gives a local "YYYY-MM-DDTHH:mm"; turn it into a UTC ISO
    // string the server (and Postgres timestamptz) can store unambiguously.
    const date = new Date(when);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      toast.error(t("errors.pastDate"));
      return;
    }

    startTransition(async () => {
      const res = await createScheduledNotification({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        scheduledFor: date.toISOString(),
        target,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("scheduledToast"));
      setTitle("");
      setBody("");
      setUrl("");
      setWhen("");
      setTarget("all");
      router.refresh();
    });
  };

  const handleCancel = (id: string) => {
    setCancelingId(id);
    startTransition(async () => {
      const res = await cancelScheduledNotification(id);
      setCancelingId(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("canceledToast"));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("titleLabel")}</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            disabled={isPending}
            className={inputClass}
            placeholder={t("titlePlaceholder")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("bodyLabel")}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            required
            disabled={isPending}
            rows={3}
            className={inputClass}
            placeholder={t("bodyPlaceholder")}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("whenLabel")}</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
              disabled={isPending}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("targetLabel")}</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as ScheduledTarget)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="all">{t("targetAll")}</option>
              <option value="self">{t("targetSelf")}</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("urlLabel")}</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={500}
            disabled={isPending}
            className={inputClass}
            placeholder="/library"
          />
        </label>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("scheduling") : t("schedule")}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("listTitle")}</h3>
        {initial.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("listEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {initial.map((item) => {
              const sent = item.sentAt !== null;
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(item.scheduledFor), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {item.targetUserId ? t("toSelf") : t("toAll")}
                      {" · "}
                      {sent
                        ? `${t("statusSent")}${
                            item.result ? ` (${t("sentTo", { sent: item.result.sent })})` : ""
                          }`
                        : t("statusPending")}
                    </span>
                  </div>
                  {!sent ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending && cancelingId === item.id}
                      onClick={() => handleCancel(item.id)}
                    >
                      {t("cancel")}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
