import { LockIcon, PinIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ModeratorActions } from "@/features/forum/components/moderator-actions";
import { PostCreateForm } from "@/features/forum/components/post-create-form";
import { PostList } from "@/features/forum/components/post-list";
import { getThread, getViewer, listPostsByThread } from "@/features/forum/queries";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("forum_categories")
    .select("slug, name")
    .eq("id", thread.category_id)
    .maybeSingle();

  const viewer = await getViewer();
  const [posts, t] = await Promise.all([
    listPostsByThread(id, viewer?.userId ?? null),
    getTranslations("forum"),
  ]);

  const categorySlug = category?.slug ?? "";
  const categoryLabel = categorySlug
    ? t.has(`categories.${categorySlug}` as "categories.general")
      ? t(`categories.${categorySlug}` as "categories.general")
      : (category?.name ?? categorySlug)
    : "";

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/forum" className="hover:text-foreground">
          {t("title")}
        </Link>
        {categorySlug ? (
          <>
            <span aria-hidden>/</span>
            <Link href={`/forum/${categorySlug}`} className="hover:text-foreground">
              {categoryLabel}
            </Link>
          </>
        ) : null}
      </nav>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {thread.pinned ? (
            <PinIcon className="size-4 text-primary" aria-label={t("pinned")} />
          ) : null}
          {thread.locked ? (
            <LockIcon className="size-4 text-muted-foreground" aria-label={t("locked")} />
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{thread.title}</h1>
        </div>
        {viewer?.isAdmin && categorySlug ? (
          <ModeratorActions
            threadId={thread.id}
            pinned={thread.pinned}
            locked={thread.locked}
            categorySlug={categorySlug}
          />
        ) : null}
      </header>

      <PostList posts={posts} viewer={viewer} threadAuthorId={thread.user_id} />

      {thread.locked && !viewer?.isAdmin ? (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t("lockedNotice")}
        </p>
      ) : viewer ? (
        <PostCreateForm threadId={thread.id} />
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 p-3 text-sm text-muted-foreground">
          <span>{t("loginToReply")}</span>
          <Link href="/login" className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}>
            {t("signIn")}
          </Link>
        </div>
      )}
    </div>
  );
}
