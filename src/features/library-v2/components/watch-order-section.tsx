import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getOwnedMediaItemIds, getWatchOrder, type WatchOrderKind } from "../watch-order";
import { WatchOrderList } from "./watch-order-list";
import { WatchOrderTabs } from "./watch-order-tabs";

function orderLabelKey(kind: WatchOrderKind): string {
  if (kind === "chronological") return "orderChronological";
  if (kind === "release") return "orderRelease";
  return "orderStory";
}

/**
 * Self-contained franchise watch-order block for a title. Fetches the order(s),
 * renders nothing when the title isn't part of a resolvable franchise. Wrap the
 * usage in <Suspense> — the anime traversal is slow on a cold cache.
 */
export async function WatchOrderSection({
  source,
  kind,
  sourceId,
  heading = true,
  emptyFallback = null,
}: {
  source: string;
  kind: string;
  sourceId: string;
  heading?: boolean;
  /** Rendered when the title isn't part of a resolvable franchise (the detail
   *  section passes null to stay hidden; the dedicated page passes a message). */
  emptyFallback?: ReactNode;
}) {
  const result = await getWatchOrder(source, kind, sourceId);
  if (!result) return <>{emptyFallback}</>;

  const orderKinds = Object.keys(result.orders) as WatchOrderKind[];
  const firstKind = orderKinds[0];
  if (!firstKind) return <>{emptyFallback}</>;
  const anyEntries = result.orders[firstKind] ?? [];
  if (anyEntries.length < 2) return <>{emptyFallback}</>;

  const t = await getTranslations("libraryV2.watchOrder");
  const ownedMap = await getOwnedMediaItemIds(anyEntries);

  const tabs = orderKinds.map((k) => ({
    key: k,
    label: t(orderLabelKey(k)),
    node: <WatchOrderList entries={result.orders[k] ?? []} ownedMap={ownedMap} />,
  }));

  return (
    <section className="flex flex-col gap-3">
      {heading ? (
        <h2 className="text-lg font-semibold tracking-tight">
          {t("title")}
          {result.franchiseName ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {result.franchiseName}
            </span>
          ) : null}
        </h2>
      ) : null}
      {tabs.length > 1 ? <WatchOrderTabs tabs={tabs} /> : tabs[0]?.node}
    </section>
  );
}
