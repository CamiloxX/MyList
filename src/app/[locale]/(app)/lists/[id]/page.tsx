import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isCurrentUserAdmin } from "@/features/admin/queries";
import { ListCoverEditor } from "@/features/lists/components/list-cover-editor";
import { ListSettings } from "@/features/lists/components/list-settings";
import { OfficialBadge } from "@/features/lists/components/official-badge";
import { OfficialListToggle } from "@/features/lists/components/official-list-toggle";
import { RemoveFromListButton } from "@/features/lists/components/remove-from-list-button";
import { ReorderItemButtons } from "@/features/lists/components/reorder-item-buttons";
import { ShareListButton } from "@/features/lists/components/share-list-button";
import { SortListMenu } from "@/features/lists/components/sort-list-menu";
import { getListWithItems } from "@/features/lists/queries";
import { Link, redirect } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  await loadingDemoDelay();
  const { id, locale } = await params;
  const [data, isAdmin] = await Promise.all([getListWithItems(id), isCurrentUserAdmin()]);
  if (!data) notFound();
  // The row can resolve for a non-owner only when the list is official. A
  // non-owner gets no items (list_items is owner-only under RLS) and must not see
  // owner-only controls, so send a non-admin viewer to the read-only public view.
  // Admins stay so they can still use the official toggle below.
  if (!data.isOwner && !isAdmin) redirect({ href: `/share/${id}`, locale });

  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/lists"
        aria-label={t("lists.back")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "self-start text-muted-foreground",
        )}
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
      </Link>

      {data.isOwner ? (
        <ListCoverEditor
          listId={data.id}
          coverUrl={data.coverUrl}
          posterUrls={data.items.map((i) => i.poster_url).filter((p): p is string => Boolean(p))}
        />
      ) : null}

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="truncate">{data.name}</span>
            {data.isOfficial ? (
              <OfficialBadge label={t("lists.official.verified")} className="size-5" />
            ) : null}
          </h1>
          {data.description ? (
            <p className="text-sm text-muted-foreground">{data.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("lists.itemCount", { count: data.items.length })}
          </p>
        </div>
        {data.isOwner ? (
          <div className="flex shrink-0 items-center gap-1">
            {data.items.length > 1 ? <SortListMenu listId={data.id} /> : null}
            <ShareListButton
              listId={data.id}
              listName={data.name}
              initialVisibility={data.visibility}
            />
            <ListSettings list={{ id: data.id, name: data.name, description: data.description }} />
          </div>
        ) : null}
      </header>

      {isAdmin ? (
        <div className="flex flex-col gap-1.5">
          <OfficialListToggle listId={data.id} initialOfficial={data.isOfficial} />
          <span className="px-1 text-xs text-muted-foreground">
            {t("lists.official.adminHint")}
          </span>
        </div>
      ) : null}

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("lists.emptyList")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm"
            >
              {data.isOwner ? (
                <ReorderItemButtons
                  listId={data.id}
                  mediaItemId={item.id}
                  isFirst={index === 0}
                  isLast={index === data.items.length - 1}
                />
              ) : null}
              <Link
                href={`/library/${item.id}`}
                className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={t("posters.alt", { title: item.title })}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </Link>
              <Link
                href={`/library/${item.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
              >
                <span className="truncate font-medium">{item.title}</span>
                <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
                {item.year ? (
                  <span className="text-xs text-muted-foreground">{item.year}</span>
                ) : null}
              </Link>
              {data.isOwner ? (
                <RemoveFromListButton listId={data.id} mediaItemId={item.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
