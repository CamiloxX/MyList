import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ListCover } from "@/features/lists/components/list-cover";
import { OfficialBadge } from "@/features/lists/components/official-badge";
import { OfficialListCard } from "@/features/lists/components/official-list-card";
import { getOfficialLists, getPublicLists } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DiscoverListsPage() {
  await loadingDemoDelay();
  const t = await getTranslations("lists");
  const [official, lists] = await Promise.all([getOfficialLists(), getPublicLists()]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link
          href="/lists"
          aria-label={t("back")}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "self-start text-muted-foreground",
          )}
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("discover.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("discover.subtitle")}</p>
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
        {official.length > 0 ? (
          <h2 className="text-base font-medium">{t("discover.communityTitle")}</h2>
        ) : null}
        {lists.length === 0 ? (
          <EmptyState title={t("discover.empty")} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/share/${list.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/30 hover:shadow-lg hover:shadow-black/5"
                >
                  <ListCover
                    coverUrl={list.coverUrl}
                    seed={list.id}
                    posterUrls={list.posterUrls}
                    className="aspect-[2/1] w-full"
                  />
                  <div className="flex flex-col gap-1 px-3 pb-3 pt-3.5">
                    <span className="truncate text-sm font-medium">{list.name}</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {list.author.avatarUrl ? (
                          <Image
                            src={list.author.avatarUrl}
                            alt=""
                            width={18}
                            height={18}
                            className="size-4 shrink-0 rounded-full object-cover"
                          />
                        ) : null}
                        <span className="truncate">
                          {t("discover.by", { name: list.author.name ?? t("discover.someone") })}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t("itemCount", { count: list.itemCount })}
                      </span>
                    </div>
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
