import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

/** Contextual skeleton for /watch-order: search box and franchise-card grids. */
export default async function WatchOrderLoading() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-32" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
            <li key={index} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
