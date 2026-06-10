import { CompassIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { CreateListButton } from "@/features/lists/components/create-list-button";
import { ListCover } from "@/features/lists/components/list-cover";
import { OfficialBadge } from "@/features/lists/components/official-badge";
import { OfficialListCard } from "@/features/lists/components/official-list-card";
import { getOfficialLists, getUserLists } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  await loadingDemoDelay();
  const t = await getTranslations("lists");
  const [official, lists] = await Promise.all([getOfficialLists(), getUserLists()]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/lists/discover"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <CompassIcon className="size-4" aria-hidden />
            {t("discover.link")}
          </Link>
          <CreateListButton />
        </div>
      </header>

      {official.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-base font-medium">
            <OfficialBadge label={t("official.verified")} className="size-4" />
            {t("official.discoverTitle")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {official.map((list) => (
              <li key={list.id}>
                <OfficialListCard list={list} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        {official.length > 0 ? <h2 className="text-base font-medium">{t("mine")}</h2> : null}
        {lists.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/lists/${list.id}`}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                    list.isOfficial
                      ? "bg-sky-500/[0.06] ring-2 ring-sky-400/50 hover:bg-sky-500/[0.12] hover:shadow-sky-500/20"
                      : "border bg-card hover:border-foreground/20 hover:bg-muted/30 hover:shadow-black/5",
                  )}
                >
                  <ListCover
                    coverUrl={list.coverUrl}
                    seed={list.id}
                    posterUrls={list.posterUrls}
                    className="aspect-[2/1] w-full"
                  />
                  <div className="flex flex-col gap-1 px-3 pb-3 pt-3.5">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{list.name}</span>
                      {list.isOfficial ? (
                        <OfficialBadge label={t("official.verified")} className="size-3.5" />
                      ) : null}
                    </span>
                    {list.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {list.description}
                      </p>
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
      </section>
    </div>
  );
}
