import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { BadgeCelebrationProvider } from "@/features/badges/components/badge-celebration-provider";
import { ChatLauncher } from "@/features/chat";
import { AccountMenu } from "@/features/library-v2/components/account-menu";
import { Sidebar } from "@/features/library-v2/components/sidebar";
import { BottomNav } from "@/features/shell/components/bottom-nav";
import { DailyVisitTracker } from "@/features/shell/components/daily-visit-tracker";
import { HeaderSearch } from "@/features/shell/components/header-search";
import { NavMore } from "@/features/shell/components/nav-more";
import { Link, redirect } from "@/i18n/navigation";
import { isMobileUserAgent } from "@/lib/device";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

// Private app pages must never be indexed: they sit behind auth and show a
// user's own data. This robots metadata is inherited by every page under the
// (app) layout (library, search, stats, settings, admin, watch-order, …).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.is_admin ?? false;

  const t = await getTranslations();

  // Device-based shell: desktops get the new sidebar "v2" experience; phones
  // keep the existing top-header + bottom-nav design exactly as it was. We
  // branch on the User-Agent (the device), not the viewport, because the
  // requirement is "v2 only on desktop, leave mobile untouched".
  const isMobile = isMobileUserAgent((await headers()).get("user-agent"));

  if (!isMobile) {
    const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "";
    return (
      <BadgeCelebrationProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar responsive={false} />
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Global account header — present on every desktop page. Account
                settings, admin (admins only) and sign-out live in this menu, so
                they are no longer duplicated in the sidebar. */}
            <header className="flex items-center justify-end gap-2 border-b bg-background/80 px-6 py-2.5 backdrop-blur">
              <ThemeToggle />
              <AccountMenu userName={displayName} isAdmin={isAdmin} />
            </header>
            {/* Content gutter so pages don't stick to the sidebar. The library
                page breaks out of this padding (it ships its own full-width
                Topbar) via a `-m-6` wrapper — keep in sync if this changes. */}
            <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
          </div>
          {user ? <ChatLauncher viewerId={user.id} viewerIsAdmin={isAdmin} /> : null}
          <DailyVisitTracker />
        </div>
      </BadgeCelebrationProvider>
    );
  }

  // Header nav links (desktop only). "Buscar" is replaced by the HeaderSearch
  // bar in the middle of the header, so it's no longer in this list.
  // Primary destinations stay inline; secondary ones + sign-out live in the
  // NavMore popover to keep the header from getting crowded.
  const navLinks = [
    { href: "/library" as const, label: t("nav.library") },
    { href: "/discover" as const, label: t("nav.discover") },
    { href: "/month" as const, label: t("nav.month") },
    { href: "/stats" as const, label: t("nav.stats") },
    ...(isAdmin ? [{ href: "/admin" as const, label: t("nav.admin") }] : []),
  ];

  return (
    <BadgeCelebrationProvider>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
            <Link
              href="/library"
              className="flex shrink-0 items-center gap-2"
              aria-label={t("app.title")}
            >
              <BrandMark size={28} />
              <Wordmark size={20} className="hidden sm:inline" />
            </Link>
            <div className="flex flex-1 justify-center">
              <HeaderSearch />
            </div>
            <ThemeToggle />
            <InstallPwaButton />
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  {link.label}
                </Link>
              ))}
              <NavMore />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
        <BottomNav isAdmin={isAdmin} />
        {user ? <ChatLauncher viewerId={user.id} viewerIsAdmin={isAdmin} /> : null}
        <DailyVisitTracker />
      </div>
    </BadgeCelebrationProvider>
  );
}
