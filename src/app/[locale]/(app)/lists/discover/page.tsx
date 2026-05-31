import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ListCover } from "@/features/lists/components/list-cover";
import { getPublicLists } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DiscoverListsPage() {
  await loadingDemoDelay();
  const t = await getTranslations("lists");
  const lists = await getPublicLists();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/lists"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "self-start text-muted-foreground",
          )}
        >
          {t("back")}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("discover.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("discover.subtitle")}</p>
        </div>
      </header>

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
                  className="h-24 w-full"
                />
                <div className="flex flex-col gap-1.5 p-4">
                  <span className="truncate font-medium">{list.name}</span>
                  {list.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
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
    </div>
  );
}
