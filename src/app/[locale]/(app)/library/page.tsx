import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { LibraryCard } from "@/features/library/components/library-card";
import { LibraryFilters } from "@/features/library/components/library-filters";
import type { MediaKind, MediaStatus } from "@/features/library/status";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_STATUSES: ReadonlyArray<MediaStatus> = ["watching", "watched", "pending", "dropped"];
const VALID_KINDS: ReadonlyArray<MediaKind> = ["movie", "tv", "anime"];

type LibraryPageProps = {
  searchParams: Promise<{ status?: string; kind?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { status: rawStatus, kind: rawKind } = await searchParams;
  const status = VALID_STATUSES.includes(rawStatus as MediaStatus)
    ? (rawStatus as MediaStatus)
    : null;
  const kind = VALID_KINDS.includes(rawKind as MediaKind) ? (rawKind as MediaKind) : null;

  const t = await getTranslations("library");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("media_items").select("*").order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);

  const { data: items, error } = await query;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        </header>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("loadError", { message: error.message })}
        </div>
      </div>
    );
  }

  const itemsList = items ?? [];
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "";
  const namePart = displayName ? `, ${displayName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("hello", { name: namePart })}
          {itemsList.length === 0 ? t("empty") : t("count", { count: itemsList.length })}
        </p>
      </header>

      <LibraryFilters />

      {itemsList.length === 0 ? (
        <EmptyState filtered={Boolean(status || kind)} />
      ) : (
        <ul className="flex flex-col gap-3">
          {itemsList.map((item) => (
            <li key={item.id}>
              <LibraryCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function EmptyState({ filtered }: { filtered: boolean }) {
  const t = await getTranslations("library");
  if (filtered) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("emptyFiltered")}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed p-12 text-center flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">{t("emptyTitle")}</p>
      <Link href="/search" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
        {t("emptyAction")}
      </Link>
    </div>
  );
}
