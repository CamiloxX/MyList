"use client";

import { MessageCircleIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useChatRealtime } from "../hooks/use-chat-realtime";
import type { ChatMessageListItem, ChatRestriction } from "../types";
import { ChatPanel } from "./chat-panel";

type Props = {
  initialMessages: ChatMessageListItem[];
  viewerId: string;
  viewerName: string;
  viewerIsAdmin: boolean;
  initialRestriction: ChatRestriction;
};

export function ChatBubble({
  initialMessages,
  viewerId,
  viewerName,
  viewerIsAdmin,
  initialRestriction,
}: Props) {
  const t = useTranslations("chat");
  const { messages, typingNames, restriction, sendTyping } = useChatRealtime({
    initial: initialMessages,
    viewerId,
    viewerName,
    initialRestriction,
  });
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Pick the presentation (bottom-sheet vs anchored panel). The Drawer is
  // portaled, so a CSS-only md:hidden wrapper wouldn't hide it — decide in JS.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Unread badge: count messages that arrive while the panel is closed.
  const [unread, setUnread] = useState(0);
  const prevLenRef = useRef(messages.length);
  useEffect(() => {
    if (!open && messages.length > prevLenRef.current) {
      setUnread((u) => u + (messages.length - prevLenRef.current));
    }
    prevLenRef.current = messages.length;
  }, [messages.length, open]);
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // A ban removes the chat entirely; an unban (live) brings it back.
  if (restriction === "ban") return null;

  const panel = (
    <ChatPanel
      messages={messages}
      viewerId={viewerId}
      viewerIsAdmin={viewerIsAdmin}
      typingNames={typingNames}
      muted={restriction === "mute"}
      onTyping={sendTyping}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("close") : t("open")}
        className={cn(
          "fixed right-4 bottom-24 z-40 flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105",
          "md:right-6 md:bottom-6",
        )}
      >
        {open && isDesktop ? (
          <XIcon className="size-6" aria-hidden />
        ) : (
          <MessageCircleIcon className="size-6" aria-hidden />
        )}
        {unread > 0 && !open ? (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {isDesktop ? (
        open ? (
          <div
            className={cn(
              "fixed right-6 bottom-24 z-40 flex h-[28rem] w-80 flex-col overflow-hidden",
              "rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h2 className="text-sm font-semibold">{t("title")}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
              >
                <XIcon className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="min-h-0 flex-1">{panel}</div>
          </div>
        ) : null
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="h-[80vh] gap-0 p-0">
            <DrawerHeader className="px-4 pt-1 pb-2">
              <DrawerTitle>{t("title")}</DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 flex-1">{panel}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
