import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { getCurrentUserAdminInfo, listCommentsByTitle } from "../queries";
import { CommentCard } from "./comment-card";
import { CommentForm } from "./comment-form";

type MediaSource = Database["public"]["Enums"]["media_source"];
type MediaKind = Database["public"]["Enums"]["media_kind"];

type Props = {
  source: MediaSource;
  sourceId: string;
  kind: MediaKind;
};

/**
 * Public, per-title comment thread. The same (source, source_id, kind) renders
 * the same conversation for every viewer — comments are NOT tied to any one
 * user's library row.
 */
export async function TitleComments({ source, sourceId, kind }: Props) {
  const [comments, viewer, t] = await Promise.all([
    listCommentsByTitle({ source, sourceId, kind }),
    getCurrentUserAdminInfo(),
    getTranslations("comments"),
  ]);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("count", { count: comments.length })}
        </span>
      </header>

      {viewer ? (
        <CommentForm source={source} sourceId={sourceId} kind={kind} />
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 p-3 text-sm text-muted-foreground">
          <span>{t("loginPrompt")}</span>
          <Link href="/login" className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}>
            {t("signIn")}
          </Link>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentCard
                comment={comment}
                viewerId={viewer?.userId ?? null}
                viewerIsAdmin={viewer?.isAdmin ?? false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
