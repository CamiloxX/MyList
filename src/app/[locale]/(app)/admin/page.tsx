import { getTranslations } from "next-intl/server";
import { AdminBadgesPanel } from "@/features/admin/components/admin-badges-panel";
import { GrantBadgesPanel } from "@/features/admin/components/grant-badges-panel";
import { getBadgesForAdmin } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const badges = await getBadgesForAdmin();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t("badges.title")}</h2>
        <AdminBadgesPanel badges={badges} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-medium">{t("grant.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("grant.subtitle")}</p>
        </div>
        <GrantBadgesPanel badges={badges} />
      </section>
    </div>
  );
}
