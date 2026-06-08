"use client";

import { useTranslations } from "next-intl";

type Props = {
  names: string[];
};

/**
 * WhatsApp-style typing indicator: a small incoming bubble with three dots
 * bouncing in a staggered loop, plus a label naming who is typing. Renders
 * nothing when no one is typing.
 */
export function ChatTypingIndicator({ names }: Props) {
  const t = useTranslations("chat");
  if (names.length === 0) return null;

  const label = names.length === 1 ? t("typingOne", { name: names[0] ?? "" }) : t("typingMany");

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-muted-foreground">
        <span className="mylist-typing-dot size-1.5 rounded-full bg-current" />
        <span
          className="mylist-typing-dot size-1.5 rounded-full bg-current"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="mylist-typing-dot size-1.5 rounded-full bg-current"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
