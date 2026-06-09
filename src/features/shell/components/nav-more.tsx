"use client";

import {
  ChevronDownIcon,
  ListIcon,
  ListOrderedIcon,
  LogOutIcon,
  NewspaperIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/watch-order", labelKey: "watchOrder", Icon: ListOrderedIcon },
  { href: "/lists", labelKey: "lists", Icon: ListIcon },
  { href: "/badges", labelKey: "badges", Icon: TrophyIcon },
  { href: "/changelog", labelKey: "changelog", Icon: NewspaperIcon },
  { href: "/settings", labelKey: "settings", Icon: SettingsIcon },
] as const;

const ROW =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted";

/**
 * Desktop overflow menu. Keeps the header light by tucking the secondary
 * destinations and sign-out behind a single "Más" popover.
 */
export function NavMore() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}>
        {t("nav.more")}
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1.5">
        <div className="flex flex-col">
          {ITEMS.map(({ href, labelKey, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={ROW}>
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {t(`nav.${labelKey}`)}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <form action={signOut}>
            <button type="submit" className={cn(ROW, "text-left")}>
              <LogOutIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {t("app.signOut")}
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
