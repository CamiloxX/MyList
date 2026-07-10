import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { WrappedCards } from "@/features/wrapped/components/wrapped-cards";
import { getSharedWrapped } from "@/features/wrapped/queries";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const shared = await getSharedWrapped(id, locale === "en" ? "en" : "es");
  if (!shared) return {};
  const t = await getTranslations({ locale, namespace: "wrapped" });
  const title = t("title", { year: shared.wrapped.year });
  return {
    title,
    description: shared.displayName ? t("sharedBy", { name: shared.displayName }) : t("subtitle"),
    // og:image comes from the opengraph-image.tsx file convention.
    twitter: { card: "summary_large_image" },
    robots: { index: false },
  };
}

/**
 * Public, unauthenticated view of a shared Wrapped. Lives OUTSIDE the (app)
 * group (like /share/[id]) so it renders without the shell. The share row is
 * the capability: revoking deletes it and this page 404s.
 */
export default async function SharedWrappedPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const shared = await getSharedWrapped(id, locale === "en" ? "en" : "es");
  if (!shared) notFound();

  const t = await getTranslations("wrapped");
  const { wrapped, displayName } = shared;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title", { year: wrapped.year })}</h1>
        {displayName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sharedBy", { name: displayName })}
          </p>
        ) : null}
      </header>

      <WrappedCards data={wrapped} locale={locale === "en" ? "en" : "es"} />

      <footer className="flex justify-center pb-6">
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          {t("poweredBy")}
        </Link>
      </footer>
    </main>
  );
}
