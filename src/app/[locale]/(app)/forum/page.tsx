import { getTranslations } from "next-intl/server";
import { CategoryList } from "@/features/forum/components/category-list";
import { listCategories } from "@/features/forum/queries";

export const dynamic = "force-dynamic";

export default async function ForumIndexPage() {
  const [categories, t] = await Promise.all([listCategories(), getTranslations("forum")]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <CategoryList categories={categories} />
    </div>
  );
}
