"use client";

import {
  BarChart3,
  CalendarDays,
  Compass,
  Library,
  List,
  ListOrdered,
  LogOut,
  Newspaper,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { BrandMark, Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

/**
 * Desktop-only left navigation rail for the library-v2 prototype. Carries the
 * same destinations the old top header exposed (primary nav + the "Más" overflow
 * items + admin), so nothing from the header is lost. Uses the app's own theme
 * tokens, not a bespoke palette.
 */
/**
 * @param isAdmin   show the admin destination.
 * @param responsive when true (the standalone sandbox), the rail hides below
 *   `lg`; when false (the main app shell, which is only rendered for desktop
 *   devices), it's always shown.
 */
export function Sidebar({
  isAdmin = false,
  responsive = true,
}: {
  isAdmin?: boolean;
  responsive?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();

  // Primary destinations — the inline header links.
  const primary: NavItem[] = [
    { href: "/library", label: t("nav.library"), icon: Library },
    { href: "/discover", label: t("nav.discover"), icon: Compass },
    { href: "/search", label: t("nav.search"), icon: Search },
    { href: "/month", label: t("nav.month"), icon: CalendarDays },
    { href: "/stats", label: t("nav.stats"), icon: BarChart3 },
    { href: "/watch-order", label: t("nav.watchOrder"), icon: ListOrdered },
    ...(isAdmin ? [{ href: "/admin", label: t("nav.admin"), icon: Shield }] : []),
  ];

  // Secondary destinations — what used to live behind the "Más" popover.
  const secondary: NavItem[] = [
    { href: "/lists", label: t("nav.lists"), icon: List },
    { href: "/badges", label: t("nav.badges"), icon: Trophy },
    { href: "/changelog", label: t("nav.changelog"), icon: Newspaper },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const isActive = (href: string) => {
    const base = href.split(/[?#]/)[0] ?? href;
    // Highlight "Mi Biblioteca" across /library, /library/[id] and the sandbox.
    if (base === "/library") return pathname === "/library" || pathname.startsWith("/library");
    return pathname === base;
  };

  const renderItem = (item: NavItem, big: boolean) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center rounded-xl font-medium transition-colors",
          big ? "gap-4 px-4 py-3 text-lg" : "gap-3.5 px-3.5 py-2.5 text-[15px]",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("shrink-0", big ? "size-6" : "size-5")} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-80 shrink-0 flex-col overflow-y-auto border-r bg-card/40 px-5 py-7",
        responsive ? "hidden lg:flex" : "flex",
      )}
    >
      <Link href="/library" className="flex items-center gap-3 px-2" aria-label={t("app.title")}>
        <BrandMark size={40} />
        <Wordmark size={27} />
      </Link>

      <p className="mt-8 px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("libraryV2.menu")}
      </p>

      <nav className="mt-3.5 flex flex-col gap-1.5" aria-label={t("nav.primary")}>
        {primary.map((item) => renderItem(item, true))}
        <div className="my-2 h-px bg-border" />
        {secondary.map((item) => renderItem(item, false))}
      </nav>

      {/* Account group sits right under the nav (everything grouped at the top);
          the natural whitespace falls below it, not as a gap in the middle. */}
      <div className="mt-6 flex flex-col gap-3">
        {/* Pro upsell card — visual fidelity to the mockup; not a real feature. */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-5 text-primary" />
            {t("libraryV2.pro.tag")} {t("libraryV2.pro.title")}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("libraryV2.pro.body")}</p>
          <Button className="mt-3.5 w-full">{t("libraryV2.pro.cta")}</Button>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-6 shrink-0" />
            {t("app.signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
