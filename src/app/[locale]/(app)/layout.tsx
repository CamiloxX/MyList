import { getTranslations } from "next-intl/server";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { BadgeCelebrationProvider } from "@/features/badges/components/badge-celebration-provider";
import { BottomNav } from "@/features/shell/components/bottom-nav";
import { HeaderSearch } from "@/features/shell/components/header-search";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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

  const t = await getTranslations();

  // Header nav links (desktop only). "Buscar" is replaced by the HeaderSearch
  // bar in the middle of the header, so it's no longer in this list.
  const navLinks = [
    { href: "/library" as const, label: t("nav.library") },
    { href: "/discover" as const, label: t("nav.discover") },
    { href: "/month" as const, label: t("nav.month") },
    { href: "/stats" as const, label: t("nav.stats") },
    { href: "/badges" as const, label: t("nav.badges") },
    { href: "/changelog" as const, label: t("nav.changelog") },
    { href: "/settings" as const, label: t("nav.settings") },
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
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  {t("app.signOut")}
                </Button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
        <BottomNav />
      </div>
    </BadgeCelebrationProvider>
  );
}
