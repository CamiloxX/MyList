import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

/** Contextual skeleton for /stats: header, 4 stat tiles and two chart blocks. */
export default async function StatsLoading() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
          <div key={index} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
