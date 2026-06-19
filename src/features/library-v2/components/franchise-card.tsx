import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Poster tile for a curated franchise on the /watch-order index. Mirrors the
 * app's PosterCard look (2:3 cover, rounded border, hover zoom) but links to the
 * franchise's first entry and shows the title count instead of a kind badge —
 * the cards already live under a "Movies" / "Anime" heading. The cover is
 * pre-resolved (see curated-franchise-covers.ts); when missing we fall back to
 * the title centered on the muted tile rather than a generic icon.
 */
export async function FranchiseCard({
  href,
  name,
  posterUrl,
  count,
}: {
  href: string;
  name: string;
  posterUrl: string | null;
  count: number;
}) {
  const t = await getTranslations("libraryV2.watchOrder");

  return (
    <Link href={href} className="group block focus:outline-none">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 40vw, 180px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium text-muted-foreground">
            {name}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{t("franchiseCount", { count })}</p>
      </div>
    </Link>
  );
}
