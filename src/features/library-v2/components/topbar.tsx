import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { LibrarySearchInput } from "@/features/library/components/library-search-input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { RATINGS_COOKIE, ratingsEnabledFromCookie } from "../ratings-prefs";
import { AccountMenu } from "./account-menu";
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

      <div className="flex shrink-0 items-center gap-3">
        <RatingsToggle initialOn={ratingsOn} />
        <AccountMenu userName={userName} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
