"use client";

import { BadgeCheckIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import { deleteChatMessage } from "../actions";
import type { ChatMessageListItem } from "../types";

type Props = {
  message: ChatMessageListItem;
  viewerId: string | null;
  viewerIsAdmin: boolean;
};

export function ChatMessageItem({ message, viewerId, viewerIsAdmin }: Props) {
  const t = useTranslations("chat");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();

  const isOwner = Boolean(viewerId && message.user_id === viewerId);
  const canDelete = isOwner || viewerIsAdmin;
  const name = message.author?.displayName?.trim() || t("anonymous");
  const createdAt = new Date(message.created_at);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteChatMessage(message.id);
      if (result.ok) toast.success(t("deleted"));
      else toast.error(result.error);
    });
  };

  return (
    <div className="group flex items-start gap-2">
      <Avatar src={message.author?.avatarUrl} name={name} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {message.author?.isAdmin ? (
            <BadgeCheckIcon className="size-3.5 shrink-0 text-sky-500" aria-label={t("adminChip")} />
          ) : null}
          <time
            className="ml-auto shrink-0 text-[11px] text-muted-foreground"
            dateTime={message.created_at}
            title={format.dateTime(createdAt, { dateStyle: "medium", timeStyle: "short" })}
          >
            {format.dateTime(createdAt, { hour: "2-digit", minute: "2-digit" })}
          </time>
          {canDelete ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              aria-label={t("delete")}
              className={cn(
                "shrink-0 rounded p-0.5 text-muted-foreground transition-opacity hover:text-destructive disabled:opacity-50",
                "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
              )}
            >
              <Trash2Icon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{message.body}</p>
      </div>
    </div>
  );
}
