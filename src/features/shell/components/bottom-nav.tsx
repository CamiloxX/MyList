"use client";

import {
  BarChart3Icon,
  CalendarIcon,
  CompassIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  NewspaperIcon,
  SearchIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/library" as const, labelKey: "library", Icon: LibraryIcon },
  { href: "/search" as const, labelKey: "search", Icon: SearchIcon },
  { href: "/discover" as const, labelKey: "discover", Icon: CompassIcon },
  { href: "/month" as const, labelKey: "month", Icon: CalendarIcon },
] as const;

const SECONDARY = [
  { href: "/stats" as const, labelKey: "stats", Icon: BarChart3Icon },
  { href: "/badges" as const, labelKey: "badges", Icon: TrophyIcon },
  { href: "/settings" as const, labelKey: "settings", Icon: SettingsIcon },
  { href: "/changelog" as const, labelKey: "changelog", Icon: NewspaperIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);

  const isOnSecondary = SECONDARY.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {PRIMARY.map(({ href, labelKey, Icon }) => {
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
        <li className="flex-1">
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
            <DrawerTrigger
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] transition-colors",
                isOnSecondary ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("more")}
            >
              <MoreHorizontalIcon className="size-5" aria-hidden />
              <span className="max-w-full truncate">{t("more")}</span>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t("more")}</DrawerTitle>
              </DrawerHeader>
              <ul className="flex flex-col gap-1 px-1 pb-2">
                {SECONDARY.map(({ href, labelKey, Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <DrawerClose
                        render={
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                              isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                            )}
                            aria-current={isActive ? "page" : undefined}
                          />
                        }
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        <span>{t(labelKey)}</span>
                      </DrawerClose>
                    </li>
                  );
                })}
              </ul>
            </DrawerContent>
          </Drawer>
        </li>
      </ul>
    </nav>
  );
}
