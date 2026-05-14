"use client";

import { CheckIcon, HeartIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthorAside } from "@/components/author-aside";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { deletePost, editPost, toggleLike } from "../actions";
import type { ForumPostListItem, ForumViewer } from "../types";

type Props = {
  post: ForumPostListItem;
  viewer: ForumViewer;
  isThreadAuthorPost?: boolean;
};

export function PostCard({ post, viewer, isThreadAuthorPost }: Props) {
  const t = useTranslations("forum");
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body_md);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(post.likedByMe);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);

  const isOwner = viewer?.userId && post.user_id === viewer.userId;
  const canDelete = Boolean(isOwner) || viewer?.isAdmin === true;
  const canEdit = Boolean(isOwner);
  const canLike = Boolean(viewer);
  const fallbackName = t("anonymous");
  const chip = isThreadAuthorPost ? t("originalPoster") : null;

  const handleLike = () => {
    if (!canLike) return;
    const previousLiked = optimisticLiked;
    const previousCount = optimisticCount;
    setOptimisticLiked(!previousLiked);
    setOptimisticCount(previousCount + (previousLiked ? -1 : 1));
    startTransition(async () => {
      const result = await toggleLike(post.id);
      if (!result.ok) {
        setOptimisticLiked(previousLiked);
        setOptimisticCount(previousCount);
        toast.error(result.error);
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await editPost({ postId: post.id, body: draft });
      if (result.ok) {
        setEditing(false);
        toast.success(t("postUpdated"));
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (result.ok) {
        toast.success(t("postDeleted"));
      } else {
        setConfirmDelete(false);
        toast.error(result.error);
      }
    });
  };

  return (
    <article
      className={cn(
        "flex gap-3 rounded-lg border bg-card p-3",
        isThreadAuthorPost && "border-primary/30",
      )}
    >
      <AuthorAside
        name={post.author?.displayName ?? null}
        avatarUrl={post.author?.avatarUrl ?? null}
        badgeIds={post.author?.badgeIds ?? []}
        verified={post.author?.isAdmin ?? false}
        verifiedLabel={t("verified")}
        chip={chip}
        fallbackLabel={fallbackName}
        className="hidden w-32 shrink-0 sm:flex"
      />

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <AuthorAside
            name={post.author?.displayName ?? null}
            avatarUrl={post.author?.avatarUrl ?? null}
            badgeIds={post.author?.badgeIds ?? []}
            verified={post.author?.isAdmin ?? false}
            verifiedLabel={t("verified")}
            chip={chip}
            fallbackLabel={fallbackName}
            variant="compact"
            className="sm:hidden"
          />
          <time
            className="ml-auto text-xs text-muted-foreground"
            dateTime={post.created_at}
            title={format.dateTime(new Date(post.created_at), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          >
            {format.relativeTime(new Date(post.created_at), new Date())}
            {post.edited_at ? <span> · {t("edited")}</span> : null}
          </time>
        </header>

        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              rows={6}
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
                  setDraft(post.body_md);
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
          <Markdown>{post.body_md}</Markdown>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant={optimisticLiked ? "secondary" : "ghost"}
            size="xs"
            disabled={!canLike || isPending}
            onClick={handleLike}
            aria-pressed={optimisticLiked}
            aria-label={canLike ? t("toggleLike") : t("loginToLike")}
            className={cn(optimisticLiked && "text-pink-500")}
          >
            <HeartIcon
              className={cn("size-3.5", optimisticLiked && "fill-current")}
              aria-hidden
            />
            {optimisticCount}
          </Button>
          {(canEdit || canDelete) && !editing ? (
            <div className="flex items-center gap-1">
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
        </footer>
      </div>
    </article>
  );
}
