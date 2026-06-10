import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ListCover } from "@/features/lists/components/list-cover";
import { OfficialBadge } from "@/features/lists/components/official-badge";
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
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {official.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/share/${list.id}`}
                  className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/30"
                >
                  <ListCover
                    coverUrl={list.coverUrl}
                    seed={list.id}
                    posterUrls={list.posterUrls}
                    className="aspect-[2/1] w-full"
                  />
                  <div className="flex flex-col gap-1 p-4">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-medium">{list.name}</span>
                      <OfficialBadge label={t("official.verified")} className="size-3.5" />
                    </span>
                    {list.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
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
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        {official.length > 0 ? (
          <h2 className="text-base font-medium">{t("discover.communityTitle")}</h2>
        ) : null}
        {lists.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">{t("discover.empty")}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/share/${list.id}`}
                  className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/30"
                >
                  <ListCover
                    coverUrl={list.coverUrl}
                    seed={list.id}
                    posterUrls={list.posterUrls}
                    className="aspect-[2/1] w-full"
                  />
                  <div className="flex flex-col gap-1.5 p-4">
                    <span className="truncate font-medium">{list.name}</span>
                    {list.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {list.description}
                      </p>
                    ) : null}
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {list.author.avatarUrl ? (
                          <Image
                            src={list.author.avatarUrl}
                            alt=""
                            width={20}
                            height={20}
                            className="size-5 shrink-0 rounded-full object-cover"
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
