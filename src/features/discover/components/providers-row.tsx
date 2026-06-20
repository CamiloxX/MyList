import { getTranslations } from "next-intl/server";
import { tmdbImage } from "@/lib/tmdb/client";
import type { WatchProvidersForTitle } from "@/lib/tmdb/discover";

type Props = {
  data: WatchProvidersForTitle;
  /** Max logos to render before collapsing the rest into a "+N" pill. */
  max?: number;
  /** When false, the "Available on" label is omitted (a surrounding heading
   *  already provides it). Defaults to true. */
  withLabel?: boolean;
};

const DEFAULT_MAX = 4;

/**
 * Horizontal row of streaming-provider logos for a single title. Each logo
 * links to TMDB's "where to watch" page when available (their deep link
 * forwards to the actual provider with affiliate-safe redirection).
 */
export async function ProvidersRow({ data, max = DEFAULT_MAX, withLabel = true }: Props) {
  const t = await getTranslations("discover.providersRow");
  const visible = data.flatrate.slice(0, max);
  const hidden = Math.max(0, data.flatrate.length - visible.length);
  const Wrapper = data.link
    ? ({ children }: { children: React.ReactNode }) => (
        <a
          href={data.link ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="flex flex-wrap items-center gap-1.5 rounded-md transition-opacity hover:opacity-80"
          aria-label={t("ariaLink")}
        >
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="flex flex-wrap items-center gap-1.5">{children}</div>
      );

  return (
    <Wrapper>
      {withLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("label")}
        </span>
      ) : null}
      {visible.map((provider) => {
        const logo = tmdbImage(provider.logo_path, "w92");
        return (
          <span
            key={provider.provider_id}
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 py-0.5 pr-2 pl-1"
          >
            {logo ? (
              // biome-ignore lint/performance/noImgElement: tiny external provider logo loaded directly.
              <img
                src={logo}
                alt=""
                className="size-4 shrink-0 rounded-sm object-cover"
                loading="lazy"
              />
            ) : null}
            <span className="text-xs font-medium">{provider.provider_name}</span>
          </span>
        );
      })}
      {hidden > 0 ? (
        <span className="inline-flex size-7 items-center justify-center rounded-md border bg-muted text-[10px] font-semibold text-muted-foreground">
          +{hidden}
        </span>
      ) : null}
    </Wrapper>
  );
}
