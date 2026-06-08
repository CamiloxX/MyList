"use client";

import { SendHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatMessage } from "../actions";
import { chatSendSchema } from "../schemas";
import type { ChatMessageListItem } from "../types";
import { ChatMessageItem } from "./chat-message-item";

type Props = {
  messages: ChatMessageListItem[];
  viewerId: string;
  viewerIsAdmin: boolean;
  typingNames: string[];
  muted: boolean;
  onTyping: () => void;
};

export function ChatPanel({
  messages,
  viewerId,
  viewerIsAdmin,
  typingNames,
  muted,
  onTyping,
}: Props) {
  const t = useTranslations("chat");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the conversation grows.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the count or typing line changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typingNames.length]);

  const send = () => {
    const parsed = chatSendSchema.safeParse({ body: draft });
    if (!parsed.success) return;
    const body = parsed.data.body;
    setDraft("");
    startTransition(async () => {
      const result = await sendChatMessage({ body });
      // On failure, restore the draft so the user doesn't lose their text.
      if (!result.ok) {
        setDraft(body);
        toast.error(result.error);
      }
    });
  };

  const typingLine =
    typingNames.length === 1
      ? t("typingOne", { name: typingNames[0] ?? "" })
      : typingNames.length > 1
        ? t("typingMany")
        : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          messages.map((m) => (
            <ChatMessageItem
              key={m.id}
              message={m}
              viewerId={viewerId}
              viewerIsAdmin={viewerIsAdmin}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 text-xs text-muted-foreground" aria-live="polite">
        {typingLine ? <span className="italic">{typingLine}</span> : null}
      </div>

      {muted ? (
        <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
          {t("mutedNotice")}
        </p>
      ) : (
        <form
          className="flex items-center gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onTyping();
            }}
            placeholder={t("placeholder")}
            maxLength={1000}
            autoComplete="off"
            aria-label={t("placeholder")}
          />
          <Button type="submit" size="icon" disabled={isPending || draft.trim().length === 0}>
            <SendHorizontalIcon className="size-4" aria-hidden />
            <span className="sr-only">{t("send")}</span>
          </Button>
        </form>
      )}
    </div>
  );
}
