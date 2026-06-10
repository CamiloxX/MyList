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
      className="flex flex-col overflow-hidden rounded-xl bg-sky-500/[0.06] ring-2 ring-sky-400/50 transition-colors hover:bg-sky-500/[0.12]"
    >
      <ListCover
        coverUrl={list.coverUrl}
        seed={list.id}
        posterUrls={list.posterUrls}
        className="aspect-[2/1] w-full"
      />
      <div className="flex flex-col gap-0.5 p-3">
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
