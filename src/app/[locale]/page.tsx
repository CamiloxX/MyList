import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect({ href: user ? "/library" : "/login", locale });
}
