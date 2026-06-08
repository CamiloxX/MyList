import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import { FeaturedBadgesCard } from "@/features/badges/components/featured-badges-card";
import { getEarnedBadgesForCurrentUser, getRecentEarnedBadges } from "@/features/badges/queries";
import { ExportCard } from "@/features/export/components/export-card";
import {
  BroadcastForm,
  listScheduledNotifications,
  NotificationsToggle,
  ScheduledForm,
  type ScheduledNotification,
} from "@/features/notifications";
import { AvatarUploadCard } from "@/features/profile/components/avatar-upload-card";
import { DisplayNameCard } from "@/features/profile/components/display-name-card";
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
  const earnedData = await getEarnedBadgesForCurrentUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("avatar_url, display_name, display_name_updated_at, is_admin")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const isAdmin = profile?.is_admin ?? false;

  // Source of truth for the visible name is profiles.display_name (kept in sync
  // with auth metadata by updateDisplayName). The 30-day cooldown is computed
  // here so the card can render a disabled state with the unlock date.
  const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? "";
  const lastNameChange = profile?.display_name_updated_at ?? null;
  const nextNameChangeAt = lastNameChange
    ? new Date(new Date(lastNameChange).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Only admins see (and can read, per RLS) the scheduled-notifications list.
  let scheduled: ScheduledNotification[] = [];
  if (isAdmin) {
    const res = await listScheduledNotifications();
    if (res.ok) scheduled = res.items;
  }

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

      {/* Unified account/profile card: avatar, name, email, password and sign
          out live together so all "who am I" settings are in one place. */}
      <section className="flex flex-col divide-y rounded-xl border bg-card">
        <div className="flex flex-col gap-2 p-4">
          <h2 className="text-base font-medium">{t("account")}</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t("email")}</dt>
            <dd>{user?.email ?? "—"}</dd>
          </dl>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{t("avatar.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("avatar.description")}</p>
          </div>
          <AvatarUploadCard
            currentAvatarUrl={profile?.avatar_url ?? null}
            displayName={
              profile?.display_name ?? user?.user_metadata?.display_name ?? user?.email ?? null
            }
          />
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{t("profileName.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("profileName.description")}</p>
          </div>
          <DisplayNameCard currentName={displayName} nextChangeAt={nextNameChangeAt} />
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{t("security.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {canChangePassword ? t("security.description") : t("security.googleHint")}
            </p>
          </div>
          {canChangePassword ? <ChangePasswordForm /> : null}
        </div>

        <div className="p-4">
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              {t("signOut")}
            </Button>
          </form>
        </div>
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
            {recentBadges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs"
              >
                <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  <BadgeIcon
                    iconKey={badge.iconKey}
                    iconUrl={badge.iconUrl}
                    name={badge.name}
                    className="size-3.5"
                  />
                </span>
                {badge.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <FeaturedBadgesCard
        earned={earnedData?.badges ?? []}
        initialFeatured={earnedData?.featured ?? []}
      />

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

      {isAdmin ? (
        <section className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">{t("broadcast.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("broadcast.description")}</p>
          </div>
          <BroadcastForm />
        </section>
      ) : null}

      {isAdmin ? (
        <section className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-card p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">{t("scheduled.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("scheduled.description")}</p>
          </div>
          <ScheduledForm initial={scheduled} />
        </section>
      ) : null}

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
