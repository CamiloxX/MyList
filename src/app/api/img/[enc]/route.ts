/**
 * Tiny image proxy: decodes a base64url-encoded image URL from the path, fetches
 * it server-side and streams it back from our own domain. Lets provider logos
 * (TMDB / AniList) load even when a network filter or ad-blocker drops requests
 * to their origin host. Host-allowlisted to avoid being an open SSRF/proxy.
 */
const ALLOWED_TMDB_HOST = "image.tmdb.org";

function isAllowedHost(hostname: string): boolean {
  return hostname === ALLOWED_TMDB_HOST || hostname.endsWith(".anilist.co");
}

export async function GET(_req: Request, ctx: { params: Promise<{ enc: string }> }) {
  const { enc } = await ctx.params;

  let target: URL;
  try {
    target = new URL(Buffer.from(enc, "base64url").toString("utf8"));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return new Response(null, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), { next: { revalidate: 86400 } });
    if (!upstream.ok) return new Response(null, { status: 502 });
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
