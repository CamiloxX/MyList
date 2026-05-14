import { MessagesSquareIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ForumCategory } from "../types";

export async function CategoryList({ categories }: { categories: ForumCategory[] }) {
  const t = await getTranslations("forum");

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {categories.map((category) => {
        const label = translateCategorySlug(category.slug, category.name, t);
        return (
          <li key={category.id}>
            <Link
              href={`/forum/${category.slug}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MessagesSquareIcon className="size-5" aria-hidden />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-medium">{label}</span>
                {category.description ? (
                  <span className="text-sm text-muted-foreground">{category.description}</span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function translateCategorySlug(
  slug: string,
  fallback: string,
  t: Awaited<ReturnType<typeof getTranslations<"forum">>>,
): string {
  // Localized labels live under forum.categories.<slug>. If a category was
  // added at runtime without an i18n entry, fall back to the DB `name`.
  const key = `categories.${slug}`;
  if (t.has(key as Parameters<typeof t>[0])) {
    return t(key as Parameters<typeof t>[0]);
  }
  return fallback;
}
