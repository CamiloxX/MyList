import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { LanguageSwitcher } from "@/features/settings/components/language-switcher";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("settings");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </header>

      <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
        <h2 className="text-base font-medium">{t("account")}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t("email")}</dt>
          <dd>{user?.email ?? "—"}</dd>
          <dt className="text-muted-foreground">{t("name")}</dt>
          <dd>{user?.user_metadata?.display_name ?? "—"}</dd>
        </dl>
        <form action={signOut} className="mt-3">
          <Button type="submit" variant="outline" size="sm">
            {t("signOut")}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{t("language")}</h2>
          <p className="text-sm text-muted-foreground">{t("languageDescription")}</p>
        </div>
        <LanguageSwitcher current={locale} />
      </section>
    </div>
  );
}
