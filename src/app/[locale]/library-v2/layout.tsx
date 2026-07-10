import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Sidebar } from "@/features/library-v2/components/sidebar";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Standalone shell for the desktop library prototype. It lives OUTSIDE the
 * regular (app) layout on purpose: it replaces the top header + bottom nav with
 * a left sidebar, so it must not inherit them. Auth is re-checked here since we
 * skip the shared (app) gate.
 *
 * The route is a dev-only sandbox: the production desktop shell already renders
 * the same components from /library, so outside development it 404s.
 */
export default async function LibraryV2Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("libraryV2");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b bg-primary/5 px-4 py-1.5 text-center text-xs text-muted-foreground lg:px-6">
          {t("prototypeNote")}
        </div>
        {children}
      </div>
    </div>
  );
}
