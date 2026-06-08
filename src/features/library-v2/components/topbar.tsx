import { ChevronDown } from "lucide-react";
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
};

/**
 * Top bar for the desktop prototype: library/discover tabs, a search field
 * (reuses the real library search) and a user chip. Server-rendered; the only
 * interactive piece is the search input.
 */
export async function Topbar({ userName, defaultQuery = "" }: Props) {
  const t = await getTranslations();
  const initial = userName.trim().charAt(0).toUpperCase() || "?";
  const ratingsOn = ratingsEnabledFromCookie((await cookies()).get(RATINGS_COOKIE)?.value);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
      <nav className="flex items-center gap-1">
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

      <div className="ml-auto flex flex-1 items-center justify-end gap-3">
        <RatingsToggle initialOn={ratingsOn} />

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
        >
          {t("libraryV2.allCategories")}
          <ChevronDown className="size-4" />
        </button>

        <div className="w-full max-w-xs">
          <LibrarySearchInput defaultValue={defaultQuery} />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initial}
          </span>
          {userName ? (
            <span className="hidden text-sm font-medium sm:inline">{userName}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
