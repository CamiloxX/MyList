import { getTranslations } from "next-intl/server";

type Item = { name: string; url: string; iconUrl: string | null };

type Props = {
  items: Item[];
  /** When false, the "Available on" label is omitted (a surrounding heading
   *  already provides it). Defaults to true. */
  withLabel?: boolean;
};

/**
 * Streaming-provider row for an anime (from AniList external links). Each
 * provider deep-links to its own site; when AniList supplies a brand icon we
 * render the logo tile, otherwise a labelled text chip. Mirrors the look of
 * <ProvidersRow> so anime and TMDB titles match.
 */
export async function AnimeProvidersRow({ items, withLabel = true }: Props) {
  const t = await getTranslations("discover.providersRow");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {withLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("label")}
        </span>
      ) : null}
      {items.map((provider) => (
        <a
          key={provider.url}
          href={provider.url}
          target="_blank"
          rel="noreferrer"
          title={provider.name}
          className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 py-0.5 pr-2 pl-1 transition-colors hover:bg-muted"
        >
          {provider.iconUrl ? (
            // biome-ignore lint/performance/noImgElement: tiny external provider logo loaded directly.
            <img
              src={provider.iconUrl}
              alt=""
              className="size-4 shrink-0 rounded-sm bg-white object-contain"
              loading="lazy"
            />
          ) : null}
          <span className="text-xs font-medium">{provider.name}</span>
        </a>
      ))}
    </div>
  );
}
