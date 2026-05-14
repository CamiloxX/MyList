import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { ThreadCreateForm } from "@/features/forum/components/thread-create-form";
import { getCategoryBySlug, getViewer } from "@/features/forum/queries";
import { Link, redirect } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; category: string }>;
};

export default async function NewThreadPage({ params }: Props) {
  const { locale, category: slug } = await params;
  const [category, viewer, t] = await Promise.all([
    getCategoryBySlug(slug),
    getViewer(),
    getTranslations("forum"),
  ]);

  if (!category) notFound();
  if (!viewer) redirect({ href: "/login", locale });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/forum/${slug}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground",
        )}
      >
        {t("backToThreads")}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newThread")}</h1>
        <p className="text-sm text-muted-foreground">{t("newThreadSubtitle")}</p>
      </header>

      <ThreadCreateForm categoryId={category.id} categorySlug={slug} />
    </div>
  );
}
