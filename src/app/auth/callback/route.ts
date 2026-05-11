import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 * Supabase + the OAuth provider (Google, etc.) redirect here with a `code`
 * query param after the user grants consent. We exchange the code for a
 * session (which sets the auth cookies via the Supabase server client) and
 * then redirect to the requested next page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/library";

  // Use the request origin (handles dev http://localhost and prod alike).
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.warn("[auth/callback] exchange error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth-failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
