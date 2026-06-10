import Image from "next/image";
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
        if (!logo) {
          return (
            <span
              key={provider.provider_id}
              title={provider.provider_name}
              className="rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium"
            >
              {provider.provider_name}
            </span>
          );
        }
        return (
          <span
            key={provider.provider_id}
            title={provider.provider_name}
            className="relative inline-block size-7 overflow-hidden rounded-md ring-1 ring-border"
          >
            <Image
              src={logo}
              alt={provider.provider_name}
              fill
              sizes="28px"
              className="object-cover"
            />
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
