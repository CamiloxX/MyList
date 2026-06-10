import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { OfficialList } from "../queries";
import { ListCover } from "./list-cover";
import { OfficialBadge } from "./official-badge";

/**
 * Highlighted card for an official list: no plain border — a sky ring + tint so
 * it stands out from community lists — plus the verified badge by the name.
 * Links to the public /share page (official lists are readable by everyone).
 */
export async function OfficialListCard({ list }: { list: OfficialList }) {
  const t = await getTranslations("lists");
  return (
    <Link
      href={`/share/${list.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-sky-500/[0.06] ring-2 ring-sky-400/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-500/[0.12] hover:shadow-lg hover:shadow-sky-500/20"
    >
      <ListCover
        coverUrl={list.coverUrl}
        seed={list.id}
        posterUrls={list.posterUrls}
        className="aspect-[2/1] w-full"
      />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-3.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{list.name}</span>
          <OfficialBadge label={t("official.verified")} className="size-3.5" />
        </span>
        <span className="text-xs text-muted-foreground">
          {t("itemCount", { count: list.itemCount })}
        </span>
      </div>
    </Link>
  );
}
