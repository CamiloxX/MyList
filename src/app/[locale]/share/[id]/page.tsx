import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ListCover } from "@/features/lists/components/list-cover";
import { OfficialBadge } from "@/features/lists/components/official-badge";
import { getSharedList } from "@/features/lists/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

/**
 * Social preview: when the share link is pasted into WhatsApp / X / etc. it
 * shows the list's cover (or first poster) + name as a rich card.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = await getSharedList(id);
  if (!list) return {};

  const image = list.coverUrl ?? list.items.find((i) => i.poster_url)?.poster_url ?? undefined;
  const description = list.description ?? undefined;
  return {
    title: list.name,
    description,
    openGraph: {
      title: list.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: list.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function SharedListPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const list = await getSharedList(id);
  if (!list) notFound();

  const t = await getTranslations();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <ListCover
        coverUrl={list.coverUrl}
        seed={id}
        posterUrls={list.items.map((i) => i.poster_url).filter((p): p is string => Boolean(p))}
        className="h-40 w-full rounded-xl sm:h-52"
        sizes="(min-width: 768px) 768px, 100vw"
      />

      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span className="min-w-0 break-words">{list.name}</span>
          {list.isOfficial ? (
            <OfficialBadge label={t("lists.official.verified")} className="size-5" />
          ) : null}
        </h1>
        {list.description ? (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("lists.itemCount", { count: list.items.length })}
        </p>
      </header>

      {list.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("lists.emptyList")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {list.items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1.5">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={t("posters.alt", { title: item.title })}
                    fill
                    sizes="(min-width: 640px) 160px, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <span className="truncate text-xs font-medium">{item.title}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        {t("lists.share.poweredBy")}
      </footer>
    </div>
  );
}
