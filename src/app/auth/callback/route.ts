import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Only accept a strictly-internal destination: a single leading slash (not a
 * protocol-relative "//host" or a backslash trick) that resolves to the SAME
 * origin. Anything else falls back to /library. Without this, a crafted
 * `next` (e.g. "@evil.com/path", which `new URL(origin + next)` parses with
 * host `evil.com`) would let the OAuth callback be used as an open redirector
 * for phishing right after a successful login.
 */
function safeNext(raw: string | null, origin: string): string {
  const candidate = raw ?? "/library";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return "/library";
  }
  try {
    const dest = new URL(candidate, origin);
    if (dest.origin !== origin) return "/library";
    return dest.pathname + dest.search + dest.hash;
  } catch {
    return "/library";
  }
}

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

  // Use the request origin (handles dev http://localhost and prod alike).
  const origin = url.origin;
  const next = safeNext(url.searchParams.get("next"), origin);

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
