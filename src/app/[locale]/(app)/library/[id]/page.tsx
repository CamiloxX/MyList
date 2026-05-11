import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RemoveButton } from "@/features/library/components/remove-button";
import { StatusSelect } from "@/features/library/components/status-select";
import { WatchEntryForm } from "@/features/library/components/watch-entry-form";
import { WatchEntryList } from "@/features/library/components/watch-entry-list";
import type { MediaStatus } from "@/features/library/status";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MediaDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase.from("media_items").select("*").eq("id", id).maybeSingle();

  if (!item) {
    notFound();
  }

  const { data: entries } = await supabase
    .from("watch_entries")
    .select("id, watched_on, rating, platform, notes")
    .eq("media_item_id", id)
    .order("watched_on", { ascending: false });

  const entriesList = entries ?? [];
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/library"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground",
        )}
      >
        {t("library.detail.back")}
      </Link>

      <article className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
          {item.poster_url ? (
            <Image
              src={item.poster_url}
              alt={t("posters.alt", { title: item.title })}
              fill
              sizes="(min-width: 640px) 160px, 128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {t("common.noPoster")}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
              <Badge variant="secondary">{t(`kinds.${item.kind}`)}</Badge>
              {item.year ? (
                <span className="text-sm text-muted-foreground">{item.year}</span>
              ) : null}
            </div>
            {item.original_title && item.original_title !== item.title ? (
              <p className="text-sm text-muted-foreground">{item.original_title}</p>
            ) : null}
          </header>
          <div className="flex flex-wrap items-center gap-2">
            <StatusSelect id={item.id} current={item.status as MediaStatus} />
            <RemoveButton id={item.id} title={item.title} />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("library.detail.entriesCount", { count: entriesList.length })}
          </p>
        </div>
      </article>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t("library.detail.history")}</h2>
        <WatchEntryList entries={entriesList} mediaItemId={item.id} />
      </section>

      <section className="flex flex-col gap-3">
        <WatchEntryForm mediaItemId={item.id} />
      </section>
    </div>
  );
}
