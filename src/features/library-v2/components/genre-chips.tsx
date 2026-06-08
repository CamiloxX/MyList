import { X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type GenreChip = {
  /** Encoded as "kind:id", e.g. "movie:18" or "anime:1". */
  value: string;
  label: string;
};

type Props = {
  chips: GenreChip[];
  /** Currently selected chip value, if any. */
  active?: string | null;
  /** Preserved query string (e.g. current ?q=) to merge with the genre param. */
  baseParams?: Record<string, string>;
};

/** Builds a /library-v2 href that sets (or clears) the genre param. */
function hrefFor(value: string | null, baseParams: Record<string, string>): string {
  const params = new URLSearchParams(baseParams);
  if (value) {
    params.set("genre", value);
  } else {
    params.delete("genre");
  }
  const qs = params.toString();
  return qs ? `/library-v2?${qs}` : "/library-v2";
}

/**
 * Genre pills mined from the user's library. Selecting one drives the page's
 * real "browse by genre" mode (TMDB /discover + Jikan). Anchored at #genres so
 * the sidebar "Categorías" link can jump here.
 */
export async function GenreChips({ chips, active, baseParams = {} }: Props) {
  const t = await getTranslations("libraryV2");

  if (chips.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("genreEmpty")}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <Link
            key={chip.value}
            href={hrefFor(isActive ? null : chip.value, baseParams)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {chip.label}
          </Link>
        );
      })}
      {active ? (
        <Link
          href={hrefFor(null, baseParams)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
          {t("clearGenre")}
        </Link>
      ) : null}
    </div>
  );
}
