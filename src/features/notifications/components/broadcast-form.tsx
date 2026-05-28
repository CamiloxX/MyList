"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { broadcastPushToAll } from "../actions";

/**
 * Admin-only form to broadcast a push notification to every subscribed
 * device. Rendered conditionally by /settings — never assume client-side
 * guarding alone is enough; the server action re-checks `is_admin`.
 */
export function BroadcastForm() {
  const t = useTranslations("settings.broadcast");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error(t("errors.required"));
      return;
    }
    startTransition(async () => {
      const res = await broadcastPushToAll({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("sentToast", { sent: res.sent, pruned: res.pruned }));
      setTitle("");
      setBody("");
      setUrl("");
    });
  };

  return (
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
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("bodyPlaceholder")}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("urlLabel")}</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          disabled={isPending}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="/library"
        />
      </label>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
