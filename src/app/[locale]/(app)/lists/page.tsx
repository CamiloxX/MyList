import { getTranslations } from "next-intl/server";
import { CreateListButton } from "@/features/lists/components/create-list-button";
import { ListCover } from "@/features/lists/components/list-cover";
import { getUserLists } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  await loadingDemoDelay();
  const t = await getTranslations("lists");
  const lists = await getUserLists();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <CreateListButton />
      </header>

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lists.map((list) => (
            <li key={list.id}>
              <Link
                href={`/lists/${list.id}`}
                className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/30"
              >
                <ListCover coverUrl={list.coverUrl} seed={list.id} className="h-24 w-full" />
                <div className="flex flex-col gap-1 p-4">
                  <span className="truncate font-medium">{list.name}</span>
                  {list.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {t("itemCount", { count: list.itemCount })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
