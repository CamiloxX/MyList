import { getTranslations } from "next-intl/server";
import { getLibraryItemKeys, libraryItemKey } from "@/features/library/queries";
import { searchTmdb } from "@/lib/tmdb/search";
import { MediaCard } from "./media-card";

export async function SearchResults({ query }: { query: string }) {
  const [results, libraryKeys] = await Promise.all([searchTmdb(query), getLibraryItemKeys()]);
  const t = await getTranslations("search");

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("noResultsTmdb", { query })}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {results.map((item) => (
        <li key={`${item.media_type}-${item.id}`}>
          <MediaCard
            item={item}
            alreadyAdded={libraryKeys.has(
              libraryItemKey({ source: "tmdb", sourceId: String(item.id), kind: item.media_type }),
            )}
          />
        </li>
      ))}
    </ul>
  );
}
