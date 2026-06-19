import { Shield } from "lucide-react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { LibrarySearchInput } from "@/features/library/components/library-search-input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { RATINGS_COOKIE, ratingsEnabledFromCookie } from "../ratings-prefs";
import { RatingsToggle } from "./ratings-toggle";

type Props = {
  /** Display name shown next to the avatar; falls back to an empty avatar. */
  userName: string;
  defaultQuery?: string;
  /** When true, show the Admin shortcut next to the account chip. */
  isAdmin?: boolean;
};

/**
 * Top bar for the desktop prototype: library/discover tabs, a search field
 * (reuses the real library search) and a user chip. Server-rendered; the only
 * interactive piece is the search input.
 */
export async function Topbar({ userName, defaultQuery = "", isAdmin = false }: Props) {
  const t = await getTranslations();
  const initial = userName.trim().charAt(0).toUpperCase() || "?";
  const ratingsOn = ratingsEnabledFromCookie((await cookies()).get(RATINGS_COOKIE)?.value);

  return (
    <div className="flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
      <nav className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-semibold",
            "bg-primary/10 text-primary",
          )}
        >
          {t("libraryV2.tabs.library")}
        </span>
        <Link
          href="/discover"
          className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("libraryV2.tabs.discover")}
        </Link>
      </nav>

      {/* Centered search */}
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-md">
          <LibrarySearchInput defaultValue={defaultQuery} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <RatingsToggle initialOn={ratingsOn} />
        {isAdmin ? (
          <Link
            href="/admin"
            title={t("nav.admin")}
            aria-label={t("nav.admin")}
            className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Shield className="size-4" aria-hidden />
          </Link>
        ) : null}
        {/* Account chip → account settings (click). Static link, no dropdown. */}
        <Link
          href="/settings"
          title={t("nav.settings")}
          className="flex items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 transition-colors hover:bg-muted"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initial}
          </span>
          {userName ? (
            <span className="hidden text-sm font-medium lg:inline">{userName}</span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
