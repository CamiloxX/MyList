import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gates the whole /admin section by profiles.is_admin. The parent (app) layout
 * already redirects anonymous users to /login, so here a logged-in non-admin is
 * sent to /library instead (sending them to /login would loop). This guard is
 * UX only — every admin server action re-checks is_admin, and RLS is the real
 * authority.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
    : { data: null };
  if (!profile?.is_admin) {
    redirect({ href: "/library", locale });
  }

  return <>{children}</>;
}
