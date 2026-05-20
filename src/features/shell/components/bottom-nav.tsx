"use client";

import {
  CalendarIcon,
  CompassIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/library" as const, labelKey: "library", Icon: LibraryIcon },
  { href: "/search" as const, labelKey: "search", Icon: SearchIcon },
  { href: "/discover" as const, labelKey: "discover", Icon: CompassIcon },
  { href: "/month" as const, labelKey: "month", Icon: CalendarIcon },
  { href: "/badges" as const, labelKey: "badges", Icon: TrophyIcon },
  { href: "/settings" as const, labelKey: "settings", Icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {ITEMS.map(({ href, labelKey, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
