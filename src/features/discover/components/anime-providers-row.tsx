import Image from "next/image";
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
      {items.map((provider) =>
        provider.iconUrl ? (
          <a
            key={provider.url}
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            title={provider.name}
            aria-label={provider.name}
            className="inline-flex size-7 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-border transition-opacity hover:opacity-80"
          >
            <Image
              src={provider.iconUrl}
              alt={provider.name}
              width={20}
              height={20}
              className="size-5 object-contain"
            />
          </a>
        ) : (
          <a
            key={provider.url}
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
          >
            {provider.name}
          </a>
        ),
      )}
    </div>
  );
}
