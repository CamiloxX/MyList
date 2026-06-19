"use client";

import { LogOutIcon, SettingsIcon, ShieldIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ROW =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted";

/**
 * Account chip in the desktop library topbar. Clicking the avatar + name opens a
 * small menu with account settings, the admin panel (admins only) and sign out —
 * instead of navigating straight to settings.
 */
export function AccountMenu({
  userName,
  isAdmin = false,
}: {
  userName: string;
  isAdmin?: boolean;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={userName || t("nav.settings")}
        className="flex items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {initial}
        </span>
        {userName ? <span className="hidden text-sm font-medium lg:inline">{userName}</span> : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1.5">
        <div className="flex flex-col">
          <Link href="/settings" onClick={() => setOpen(false)} className={ROW}>
            <SettingsIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {t("nav.settings")}
          </Link>
          {isAdmin ? (
            <Link href="/admin" onClick={() => setOpen(false)} className={ROW}>
              <ShieldIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {t("nav.admin")}
            </Link>
          ) : null}
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
