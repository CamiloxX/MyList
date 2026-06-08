import { getTranslations } from "next-intl/server";
import { AdminBadgesPanel } from "@/features/admin/components/admin-badges-panel";
import { getBadgesForAdmin } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const badges = await getBadgesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section className="flex flex-col gap-3">
        <AdminBadgesPanel badges={badges} />
      </section>
    </div>
  );
}
