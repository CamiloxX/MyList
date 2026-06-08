import { StarIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { AuthorAside } from "@/components/author-aside";
import { getPublicProfileByUsername } from "@/features/profile/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; username: string }> };

/** The dynamic [locale] segment is a plain string; narrow it to our two locales. */
function normalizeLocale(locale: string): "es" | "en" {
  return locale === "en" ? "en" : "es";
}

/**
 * Social preview for a shared profile link: avatar + name + a one-line stat
 * summary. Returns empty metadata (no rich card) for private/unknown handles so
 * nothing leaks before the 404.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const profile = await getPublicProfileByUsername(username, normalizeLocale(locale));
  if (!profile) return {};

  const t = await getTranslations({ locale, namespace: "profile" });
  const title = profile.displayName ?? `@${profile.username}`;
  const description = t("public.metaStats", {
    titles: profile.overview.totalEntries,
    hours: profile.overview.totalHours,
  });
  const image = profile.avatarUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const profile = await getPublicProfileByUsername(username, normalizeLocale(locale));
  if (!profile) notFound();

  const t = await getTranslations();
  const format = await getFormatter();

  const { overview, streak, topGenres, topRated, recent, badges } = profile;
  const isEmpty = overview.totalEntries === 0;
  const maxGenre = topGenres.reduce((m, g) => Math.max(m, g.count), 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-1">
        <AuthorAside
          name={profile.displayName}
          avatarUrl={profile.avatarUrl}
          badges={badges}
          variant="sidebar"
          chip={`@${profile.username}`}
        />
      </header>

      {isEmpty ? (
        <p className="text-center text-sm text-muted-foreground">{t("profile.public.empty")}</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label={t("profile.public.labelTitles")} value={overview.totalEntries} />
            <StatTile label={t("profile.public.labelHours")} value={overview.totalHours} />
            <StatTile label={t("profile.public.currentStreak")} value={streak.current} />
            <StatTile label={t("profile.public.longestStreak")} value={streak.longest} />
          </section>

          {overview.totalHours > 0 ? (
            <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-medium">{t("profile.public.byKindTitle")}</h2>
              <KindHoursBar
                hours={overview.hoursByKind}
                labels={{
                  movie: t("kinds.movie"),
                  tv: t("kinds.tv"),
                  anime: t("kinds.anime"),
                }}
              />
            </section>
          ) : null}

          {topRated.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-medium">{t("profile.public.topRatedTitle")}</h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {topRated.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1.5">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                      {item.poster_url ? (
                        <Image
                          src={item.poster_url}
                          alt={t("posters.alt", { title: item.title })}
                          fill
                          sizes="(min-width: 640px) 130px, 33vw"
                          className="object-cover"
                        />
                      ) : null}
                      <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <StarIcon className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                        {item.bestRating}
                      </span>
                    </div>
                    <span className="truncate text-xs font-medium">{item.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {topGenres.length > 0 ? (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-medium">{t("profile.public.genresTitle")}</h2>
              <ul className="flex flex-col gap-2">
                {topGenres.map((g) => (
                  <li key={g.name} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 truncate text-muted-foreground">{g.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${maxGenre > 0 ? (g.count / maxGenre) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                      {g.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {recent.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-medium">{t("profile.public.recentTitle")}</h2>
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {recent.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                      {item.posterUrl ? (
                        <Image
                          src={item.posterUrl}
                          alt={t("posters.alt", { title: item.title })}
                          fill
                          sizes="(min-width: 640px) 80px, 25vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {format.dateTime(new Date(`${item.watchedOn}T12:00:00Z`), {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        {t("profile.public.poweredBy")}
      </footer>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border bg-card p-4 text-center">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function KindHoursBar({
  hours,
  labels,
}: {
  hours: { movie: number; tv: number; anime: number };
  labels: { movie: string; tv: string; anime: string };
}) {
  const total = hours.movie + hours.tv + hours.anime;
  const pct = (v: number) => (total > 0 ? `${(v / total) * 100}%` : "0%");
  const segments = [
    { key: "movie" as const, color: "bg-sky-500", value: hours.movie, label: labels.movie },
    { key: "tv" as const, color: "bg-violet-500", value: hours.tv, label: labels.tv },
    { key: "anime" as const, color: "bg-emerald-500", value: hours.anime, label: labels.anime },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <div key={s.key} className={s.color} style={{ width: pct(s.value) }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", s.color)} aria-hidden />
            <span>
              {s.label} · {s.value} h
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
