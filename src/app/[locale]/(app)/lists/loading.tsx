import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

/** Contextual skeleton for /lists: header with actions and a covers grid. */
export default async function ListsLoading() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
