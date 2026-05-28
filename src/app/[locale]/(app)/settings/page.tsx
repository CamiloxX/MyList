import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { BADGE_BY_ID } from "@/features/badges/catalog";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import { getRecentEarnedBadges } from "@/features/badges/queries";
import { ExportCard } from "@/features/export/components/export-card";
import { AvatarUploadCard } from "@/features/profile/components/avatar-upload-card";
import { NotificationsToggle } from "@/features/notifications";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { LanguageSwitcher } from "@/features/settings/components/language-switcher";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { loadingDemoDelay } from "@/lib/loading-demo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await loadingDemoDelay();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("settings");
  const tBadges = await getTranslations("badges");
  const tChangelog = await getTranslations("changelog");
  const locale = (await getLocale()) as Locale;
  const recentBadges = await getRecentEarnedBadges(3);

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  // Supabase tags every connected provider on `app_metadata.providers`. Only
  // accounts that signed up (or linked) with email/password have a password to
  // change — Google-only users would need a separate "set password" flow.
  const providers = (user?.app_metadata?.providers ?? []) as string[];
  const canChangePassword = providers.includes("email");

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
          <h2 className="text-base font-medium">{t("avatar.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("avatar.description")}</p>
        </div>
        <AvatarUploadCard
          currentAvatarUrl={profile?.avatar_url ?? null}
          displayName={
            profile?.display_name ?? user?.user_metadata?.display_name ?? user?.email ?? null
          }
        />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-medium">{tBadges("recentTitle")}</h2>
          <Link href="/badges" className="text-xs text-muted-foreground hover:text-foreground">
            {tBadges("seeAll")} →
          </Link>
        </div>
        {recentBadges.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tBadges("recentEmpty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {recentBadges.map((earned) => {
              const def = BADGE_BY_ID.get(earned.badgeId);
              if (!def) return null;
              return (
                <li
                  key={earned.badgeId}
                  className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs"
                >
                  <BadgeIcon iconKey={def.iconKey} className="size-3.5" />
                  {tBadges(`items.${def.i18nKey}.name`)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {canChangePassword ? (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">{t("security.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("security.description")}</p>
          </div>
          <ChangePasswordForm />
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{t("language")}</h2>
          <p className="text-sm text-muted-foreground">{t("languageDescription")}</p>
        </div>
        <LanguageSwitcher current={locale} />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{t("notifications.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.description")}</p>
        </div>
        <NotificationsToggle />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{t("export.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("export.description")}</p>
        </div>
        <ExportCard />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">{tChangelog("title")}</h2>
            <p className="text-sm text-muted-foreground">{tChangelog("subtitle")}</p>
          </div>
          <Link href="/changelog" className="text-xs text-muted-foreground hover:text-foreground">
            {tChangelog("settingsLink")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
