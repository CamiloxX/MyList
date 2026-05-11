import { getTranslations } from "next-intl/server";
import { BadgesGrid } from "@/features/badges/components/badges-grid";
import { getBadgesForCurrentUser } from "@/features/badges/queries";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function BadgesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("badges");
  const badges = await getBadgesForCurrentUser();

  // The (app) layout already redirects unauthenticated users; this is only
  // reached if the auth cookie was invalidated mid-request.
  if (badges == null) {
    redirect({ href: "/login", locale });
    return null;
  }

  const earnedCount = badges.filter((b) => b.earnedAt != null).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("summary", { earned: earnedCount, total: badges.length })}
        </p>
      </header>

      <BadgesGrid items={badges} />
    </div>
  );
}
