import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ListCoverEditor } from "@/features/lists/components/list-cover-editor";
import { ListSettings } from "@/features/lists/components/list-settings";
import { RemoveFromListButton } from "@/features/lists/components/remove-from-list-button";
import { ShareListButton } from "@/features/lists/components/share-list-button";
import { getListWithItems } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await loadingDemoDelay();
  const { id } = await params;
  const data = await getListWithItems(id);
  if (!data) notFound();

  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/lists"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground",
        )}
      >
        {t("lists.back")}
      </Link>

      <ListCoverEditor listId={data.id} coverUrl={data.coverUrl} />

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{data.name}</h1>
          {data.description ? (
            <p className="text-sm text-muted-foreground">{data.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("lists.itemCount", { count: data.items.length })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ShareListButton listId={data.id} listName={data.name} initialShared={data.shared} />
          <ListSettings list={{ id: data.id, name: data.name, description: data.description }} />
        </div>
      </header>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("lists.emptyList")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm"
            >
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
              <RemoveFromListButton listId={data.id} mediaItemId={item.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
