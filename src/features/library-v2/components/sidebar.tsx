"use client";

import {
  Bookmark,
  Compass,
  Heart,
  HelpCircle,
  LayoutGrid,
  Library,
  LogOut,
  Settings,
  Sparkles,
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
 * Desktop-only left navigation rail for the library-v2 prototype. Mirrors the
 * mockup's structure (menu list + Pro upsell + sign-out) but wires every entry
 * to a real route and uses the app's own theme tokens instead of a new palette.
 */
export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/discover", label: t("nav.discover"), icon: Compass },
    { href: "/library-v2", label: t("libraryV2.tabs.library"), icon: Library },
    { href: "/library-v2#genres", label: t("libraryV2.categories"), icon: LayoutGrid },
    { href: "/library?status=pending", label: t("libraryV2.watchlist"), icon: Bookmark },
    { href: "/library?status=watching", label: t("libraryV2.favorites"), icon: Heart },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
    { href: "/changelog", label: t("libraryV2.help"), icon: HelpCircle },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r bg-card/40 px-4 py-6 lg:flex">
      <Link
        href="/library-v2"
        className="flex items-center gap-2.5 px-2"
        aria-label={t("app.title")}
      >
        <BrandMark size={36} />
        <Wordmark size={25} />
      </Link>

      <p className="mt-7 px-2 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("libraryV2.menu")}
      </p>

      <nav className="mt-3 flex flex-col gap-1.5" aria-label={t("nav.primary")}>
        {items.map((item) => {
          const active =
            pathname === item.href.split(/[?#]/)[0] && item.href.startsWith("/library-v2");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-lg font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-6 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account group sits right under the nav (everything grouped at the top);
          the natural whitespace falls below it, not as a gap in the middle. */}
      <div className="mt-5 flex flex-col gap-2.5">
        {/* Pro upsell card — visual fidelity to the mockup; not a real feature. */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-3.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            {t("libraryV2.pro.tag")} {t("libraryV2.pro.title")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("libraryV2.pro.body")}</p>
          <Button size="sm" className="mt-3 w-full">
            {t("libraryV2.pro.cta")}
          </Button>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-6 shrink-0" />
            {t("app.signOut")}
          </button>
        </form>
      </div>
    </aside>
  );
}
