"use client";

import {
  BadgeCheckIcon,
  BanIcon,
  MicOffIcon,
  MoreVerticalIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { banUser, deleteChatMessage, muteUser, unrestrictUser } from "../actions";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const targetId = message.user_id;
  const isOwner = Boolean(viewerId && targetId === viewerId);
  const canDelete = isOwner || viewerIsAdmin;
  // Admin moderation only targets other real users.
  const canModerate = viewerIsAdmin && Boolean(targetId) && !isOwner;
  const hasMenu = canDelete || canModerate;

  const name = message.author?.displayName?.trim() || t("anonymous");
  const createdAt = new Date(message.created_at);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successKey: string) => {
    setMenuOpen(false);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(t(successKey));
      else toast.error(result.error ?? "");
    });
  };

  return (
    <div className="group flex items-start gap-2">
      <Avatar src={message.author?.avatarUrl} name={name} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {message.author?.isAdmin ? (
            <BadgeCheckIcon
              className="size-3.5 shrink-0 text-sky-500"
              aria-label={t("adminChip")}
            />
          ) : null}
          <time
            className="ml-auto shrink-0 text-[11px] text-muted-foreground"
            dateTime={message.created_at}
            title={format.dateTime(createdAt, { dateStyle: "medium", timeStyle: "short" })}
          >
            {format.dateTime(createdAt, { hour: "2-digit", minute: "2-digit" })}
          </time>
          {hasMenu ? (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger
                aria-label={t("messageMenu")}
                disabled={isPending}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-xs" }),
                  "shrink-0 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
                )}
              >
                <MoreVerticalIcon className="size-4" aria-hidden />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                <div className="flex flex-col">
                  {canDelete ? (
                    <MenuButton
                      icon={<Trash2Icon className="size-3.5" aria-hidden />}
                      label={t("delete")}
                      destructive
                      disabled={isPending}
                      onClick={() => run(() => deleteChatMessage(message.id), "deleted")}
                    />
                  ) : null}
                  {canModerate && targetId ? (
                    <>
                      <MenuButton
                        icon={<MicOffIcon className="size-3.5" aria-hidden />}
                        label={t("mute")}
                        disabled={isPending}
                        onClick={() => run(() => muteUser(targetId), "mutedToast")}
                      />
                      <MenuButton
                        icon={<BanIcon className="size-3.5" aria-hidden />}
                        label={t("ban")}
                        destructive
                        disabled={isPending}
                        onClick={() => run(() => banUser(targetId), "bannedToast")}
                      />
                      <MenuButton
                        icon={<ShieldCheckIcon className="size-3.5" aria-hidden />}
                        label={t("unrestrict")}
                        disabled={isPending}
                        onClick={() => run(() => unrestrictUser(targetId), "unrestrictedToast")}
                      />
                    </>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{message.body}</p>
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors disabled:opacity-50",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-muted [&_svg]:text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
