import { StarIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RatingsBadge } from "@/features/discover/components/ratings-badge";
import { AddToLibraryButton } from "@/features/library/components/add-to-library-button";
import { TrailerButton } from "@/features/library/components/trailer-button";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { loadTitlePreview } from "../preview-data";

const SOURCES = new Set(["tmdb", "anilist"]);
const KINDS = new Set(["movie", "tv", "anime"]);

/**
 * Title preview for a not-yet-added recommendation/discover result. If the user
 * already has the title, redirects to the full library detail; otherwise shows
 * its info (synopsis, trailer, airing, RT/IMDb) with a one-click add action.
 * Desktop-only; rendered for `/library/title/...`.
 */
export async function DesktopTitlePreview({
  locale,
  source,
  kind,
  sourceId,
}: {
  locale: string;
  source: string;
  kind: string;
  sourceId: string;
}) {
  if (!SOURCES.has(source) || !KINDS.has(kind)) notFound();
  const src = source as "tmdb" | "anilist";
  const knd = kind as "movie" | "tv" | "anime";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already in the library? Send them to the real detail view instead.
  if (user) {
    const { data: existing } = await supabase
      .from("media_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("source", src)
      .eq("source_id", sourceId)
      .eq("kind", knd)
      .maybeSingle();
    if (existing) {
      redirect({ href: `/library/${existing.id}`, locale });
    }
  }

  const preview = await loadTitlePreview(src, knd, sourceId);
  if (!preview) notFound();

  const t = await getTranslations();

  return (
    <div className="flex flex-col">
      <header className="relative isolate overflow-hidden">
        {preview.backdropUrl ? (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={preview.backdropUrl}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40" />
          </div>
        ) : preview.posterUrl ? (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={preview.posterUrl}
              alt=""
              fill
              sizes="100vw"
              className="scale-125 object-cover blur-2xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
            <div className="absolute inset-0 [background:radial-gradient(circle_at_78%_12%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_55%)]" />
          </div>
        ) : (
          <div className="absolute inset-0 -z-10 bg-card" aria-hidden />
        )}

        <div className="relative px-6 pt-6 lg:px-10">
          <Link
            href="/library"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "gap-2 bg-background/50 backdrop-blur",
            )}
          >
            {t("library.detail.back")}
          </Link>
        </div>

        <div className="relative flex flex-col gap-6 px-6 pb-10 pt-28 sm:flex-row sm:items-end sm:pt-44 lg:px-10">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-2xl sm:w-48">
            {preview.posterUrl ? (
              <Image
                src={preview.posterUrl}
                alt={t("posters.alt", { title: preview.title })}
                fill
                sizes="(min-width: 640px) 192px, 160px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                {t("common.noPoster")}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("libraryV2.detail.notInLibrary")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(`kinds.${preview.kind}`)}</Badge>
              {preview.airing !== "unknown" ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-transparent",
                    preview.airing === "airing" &&
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    preview.airing === "upcoming" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                    preview.airing === "ended" && "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`library.detail.airing.${preview.airing}`)}
                </Badge>
              ) : null}
              {preview.genreNames.slice(0, 4).map((g) => (
                <Badge key={g} variant="outline" className="bg-background/40 backdrop-blur">
                  {g}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
              {preview.title}
            </h1>
            {preview.originalTitle && preview.originalTitle !== preview.title ? (
              <p className="text-sm text-muted-foreground">{preview.originalTitle}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {preview.score ? (
                <span className="flex items-center gap-1 font-semibold text-amber-500">
                  <StarIcon className="size-4 fill-current" aria-hidden />
                  {preview.score}
                </span>
              ) : null}
              {preview.year ? <span>{preview.year}</span> : null}
              {preview.episodeCount ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{t("libraryV2.episodes", { count: preview.episodeCount })}</span>
                </>
              ) : null}
            </div>
            {preview.ratings ? <RatingsBadge ratings={preview.ratings} /> : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-10">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <AddToLibraryButton {...preview.addPayload} />
            {preview.trailer ? (
              <TrailerButton youtubeKey={preview.trailer.youtubeKey} title={preview.title} />
            ) : null}
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("libraryV2.detail.synopsis")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {preview.synopsis ?? t("libraryV2.detail.noSynopsis")}
            </p>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold tracking-tight">
              {t("libraryV2.detail.details")}
            </h3>
            <dl className="flex flex-col gap-3">
              <DetailRow
                label={t("libraryV2.detail.labelType")}
                value={t(`kinds.${preview.kind}`)}
              />
              {preview.year ? (
                <DetailRow label={t("libraryV2.detail.labelYear")} value={String(preview.year)} />
              ) : null}
              {preview.originalTitle && preview.originalTitle !== preview.title ? (
                <DetailRow
                  label={t("libraryV2.detail.labelOriginalTitle")}
                  value={preview.originalTitle}
                />
              ) : null}
              {preview.score ? (
                <DetailRow
                  label={t("libraryV2.detail.labelScore")}
                  value={`${preview.score} / 10`}
                />
              ) : null}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
