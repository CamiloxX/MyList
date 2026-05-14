"use client";

import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthorAside } from "@/components/author-aside";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteComment, editComment } from "../actions";
import type { TitleCommentListItem } from "../types";

type Props = {
  comment: TitleCommentListItem;
  viewerId: string | null;
  viewerIsAdmin: boolean;
};

export function CommentCard({ comment, viewerId, viewerIsAdmin }: Props) {
  const t = useTranslations("comments");
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body_md);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = viewerId && comment.user_id === viewerId;
  const canEdit = Boolean(isOwner);
  const canDelete = Boolean(isOwner) || viewerIsAdmin;
  const fallbackName = t("anonymous");

  const handleSave = () => {
    startTransition(async () => {
      const result = await editComment({ commentId: comment.id, body: draft });
      if (result.ok) {
        setEditing(false);
        toast.success(t("updated"));
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.ok) {
        toast.success(t("deleted"));
      } else {
        setConfirmDelete(false);
        toast.error(result.error);
      }
    });
  };

  return (
    <article className="flex gap-3 rounded-lg border bg-card p-3">
      <AuthorAside
        name={comment.author?.displayName ?? null}
        avatarUrl={comment.author?.avatarUrl ?? null}
        badgeIds={comment.author?.badgeIds ?? []}
        fallbackLabel={fallbackName}
        className="hidden w-32 shrink-0 sm:flex"
      />

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <AuthorAside
            name={comment.author?.displayName ?? null}
            avatarUrl={comment.author?.avatarUrl ?? null}
            badgeIds={comment.author?.badgeIds ?? []}
            fallbackLabel={fallbackName}
            variant="compact"
            className="sm:hidden"
          />
          <time
            className="ml-auto text-xs text-muted-foreground"
            dateTime={comment.created_at}
            title={format.dateTime(new Date(comment.created_at), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          >
            {format.relativeTime(new Date(comment.created_at), new Date())}
            {comment.edited_at ? <span> · {t("edited")}</span> : null}
          </time>
        </header>

        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isPending}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setDraft(comment.body_md);
                  setEditing(false);
                }}
              >
                <XIcon className="size-3.5" aria-hidden />
                {t("cancel")}
              </Button>
              <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
                <CheckIcon className="size-3.5" aria-hidden />
                {isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        ) : (
          <Markdown>{comment.body_md}</Markdown>
        )}

        {(canEdit || canDelete) && !editing ? (
          <div className="flex items-center justify-end gap-1">
            {canEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isPending}
                onClick={() => setEditing(true)}
                className="text-muted-foreground"
              >
                <PencilIcon className="size-3.5" aria-hidden />
                {t("edit")}
              </Button>
            ) : null}
            {canDelete ? (
              confirmDelete ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    disabled={isPending}
                    onClick={handleDelete}
                  >
                    {t("confirmDelete")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isPending}
                    onClick={() => setConfirmDelete(false)}
                  >
                    {t("cancel")}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isPending}
                  onClick={() => setConfirmDelete(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" aria-hidden />
                  {t("delete")}
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
