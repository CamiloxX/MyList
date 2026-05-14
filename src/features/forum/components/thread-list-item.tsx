import { LockIcon, PinIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ForumThreadListItem } from "../types";

export async function ThreadListItemRow({ thread }: { thread: ForumThreadListItem }) {
  const t = await getTranslations("forum");
  const format = await getFormatter();
  const authorLabel = thread.author?.displayName?.trim() || t("anonymous");

  return (
    <li>
      <Link
        href={`/forum/thread/${thread.id}`}
        className={cn(
          "flex flex-col gap-1 rounded-lg border bg-card p-3 transition-colors hover:bg-muted",
          thread.pinned && "border-primary/30 bg-primary/5",
        )}
      >
        <div className="flex items-center gap-2">
          {thread.pinned ? (
            <PinIcon className="size-3.5 text-primary" aria-label={t("pinned")} />
          ) : null}
          {thread.locked ? (
            <LockIcon
              className="size-3.5 text-muted-foreground"
              aria-label={t("locked")}
            />
          ) : null}
          <span className="line-clamp-2 font-medium">{thread.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t("byAuthor", { name: authorLabel })}</span>
          <span aria-hidden>·</span>
          <span>
            {t("replyCount", { count: thread.reply_count })}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={thread.last_post_at}>
            {format.relativeTime(new Date(thread.last_post_at), new Date())}
          </time>
        </div>
      </Link>
    </li>
  );
}
