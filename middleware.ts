import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

const APP_PATTERN = /^\/(library|search|stats|lists|settings|month|year)(\/|$)/;
const AUTH_PATTERN = /^\/(login|register)(\/|$)/;
const LOCALE_PREFIX = /^\/(es|en)(?=\/|$)/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase OAuth callback lives at /auth/callback (no locale prefix).
  // Just refresh the session and pass through — next-intl is not involved.
  if (pathname.startsWith("/auth/")) {
    const { response } = await updateSession(request);
    return response;
  }

  // 1) Refresh Supabase session on every request and read the current user.
  const { response: supabaseResponse, user } = await updateSession(request);

  // 2) Apply auth-driven redirects using a locale-stripped path so the rules
  //    work whether the URL is /library or /es/library.
  const pathWithoutLocale = pathname.replace(LOCALE_PREFIX, "") || "/";
  const isAuthRoute = AUTH_PATTERN.test(pathWithoutLocale);
  const isAppRoute = APP_PATTERN.test(pathWithoutLocale);

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/library";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 3) Hand off to next-intl for locale routing/rewriting.
  const intlResponse = handleI18n(request);

  // Forward any cookies Supabase set (refreshed JWT, etc.) onto the intl response.
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }

  return intlResponse;
}

export const config = {
  // Run on every request except Next internals and static image assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
