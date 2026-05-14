import { PlusIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ThreadListItemRow } from "@/features/forum/components/thread-list-item";
import { getCategoryBySlug, getViewer, listThreadsByCategory } from "@/features/forum/queries";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [threads, viewer, t] = await Promise.all([
    listThreadsByCategory(category.id),
    getViewer(),
    getTranslations("forum"),
  ]);

  const categoryLabel = t.has(`categories.${slug}` as "categories.general")
    ? t(`categories.${slug}` as "categories.general")
    : category.name;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/forum"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground",
        )}
      >
        {t("backToCategories")}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{categoryLabel}</h1>
          {category.description ? (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          ) : null}
        </div>
        {viewer ? (
          <Link
            href={`/forum/${slug}/new`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <PlusIcon className="size-4" aria-hidden />
            {t("newThread")}
          </Link>
        ) : null}
      </header>

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyThreads")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((thread) => (
            <ThreadListItemRow key={thread.id} thread={thread} />
          ))}
        </ul>
      )}
    </div>
  );
}
