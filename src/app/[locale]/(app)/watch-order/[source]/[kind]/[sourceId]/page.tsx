import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { WatchOrderSection } from "@/features/library-v2/components/watch-order-section";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ source: string; kind: string; sourceId: string }>;
};

export default async function WatchOrderDetailPage({ params }: PageProps) {
  const { source, kind, sourceId } = await params;
  const t = await getTranslations("libraryV2.watchOrder");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 lg:px-6">
      <Link
        href="/watch-order"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {t("pageTitle")}
      </Link>

      <Suspense fallback={<p className="text-sm text-muted-foreground">{`${t("title")}…`}</p>}>
        <WatchOrderSection
          source={source}
          kind={kind}
          sourceId={sourceId}
          emptyFallback={
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          }
        />
      </Suspense>
    </div>
  );
}
