"use client";

import { CheckIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthorAside } from "@/components/author-aside";
import { Markdown } from "@/components/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
        badges={comment.author?.badges ?? []}
        verified={comment.author?.isAdmin ?? false}
        verifiedLabel={t("verified")}
        verifiedChipLabel={t("adminChip")}
        fallbackLabel={fallbackName}
        className="hidden w-32 shrink-0 sm:flex"
      />

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <header className="flex flex-wrap items-start justify-between gap-2 sm:items-baseline">
          <AuthorAside
            name={comment.author?.displayName ?? null}
            avatarUrl={comment.author?.avatarUrl ?? null}
            badges={comment.author?.badges ?? []}
            verified={comment.author?.isAdmin ?? false}
            verifiedLabel={t("verified")}
            verifiedChipLabel={t("adminChip")}
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
          <div className="flex items-center justify-end">
            <Popover
              open={menuOpen}
              onOpenChange={(open) => {
                setMenuOpen(open);
                // Reset the delete confirmation whenever the menu closes so it
                // reopens on the action list, not mid-confirmation.
                if (!open) setConfirmDelete(false);
              }}
            >
              <PopoverTrigger
                aria-label={t("menuLabel")}
                disabled={isPending}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-xs" }),
                  "text-muted-foreground",
                )}
              >
                <MoreVerticalIcon className="size-4" aria-hidden />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1.5">
                {confirmDelete ? (
                  <div className="flex flex-col gap-2 p-1">
                    <p className="text-sm text-muted-foreground">{t("confirmDeleteTitle")}</p>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={isPending}
                        onClick={() => setConfirmDelete(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        disabled={isPending}
                        onClick={handleDelete}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {canEdit ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        <PencilIcon className="size-3.5 text-muted-foreground" aria-hidden />
                        {t("edit")}
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setConfirmDelete(true)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                        {t("delete")}
                      </button>
                    ) : null}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>
    </article>
  );
}
