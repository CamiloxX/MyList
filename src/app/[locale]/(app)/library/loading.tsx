import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Contextual skeleton for the library. The real shell picks mobile/desktop by
 * User-Agent, but a loading file can only approximate by breakpoint: card rows
 * under md (mobile list) and a poster grid from md up (desktop library).
 */
export default async function LibraryLoading() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
          <li key={index} className="flex gap-4 rounded-xl border bg-card p-3">
            <Skeleton className="aspect-[2/3] w-20 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>

      <ul className="hidden gap-4 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no reorder
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
          </li>
        ))}
      </ul>
    </div>
  );
}
