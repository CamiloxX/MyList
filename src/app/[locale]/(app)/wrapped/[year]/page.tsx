import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ShareWrappedButton } from "@/features/wrapped/components/share-wrapped-button";
import { WrappedCards } from "@/features/wrapped/components/wrapped-cards";
import { getWrapped, getWrappedShareId } from "@/features/wrapped/queries";
import { Link } from "@/i18n/navigation";
import { parseYear } from "@/lib/dates";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ year: string; locale: string }>;
}) {
  await loadingDemoDelay();
  const { year: rawYear } = await params;
  const t = await getTranslations("wrapped");
  const locale = (await getLocale()) === "en" ? "en" : "es";

  const year = parseYear(rawYear);
  if (!year) {
    return <WrappedEmpty title={t("invalidYear")} action={t("goStats")} />;
  }

  const [data, shareId] = await Promise.all([getWrapped(year, locale), getWrappedShareId(year)]);
  if (!data) {
    return <WrappedEmpty title={t("empty", { year })} action={t("goStats")} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title", { year })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ShareWrappedButton year={year} initialShareId={shareId} />
      </header>

      <WrappedCards data={data} locale={locale} />

      <Link
        href="/stats"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "self-center")}
      >
        {t("goStats")}
      </Link>
    </div>
  );
}

function WrappedEmpty({ title, action }: { title: string; action: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <EmptyState
        title={title}
        action={
          <Link href="/stats" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {action}
          </Link>
        }
      />
    </div>
  );
}
