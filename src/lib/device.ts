/**
 * Server-side device detection from the User-Agent header.
 *
 * Used to decide, per request, whether to render the mobile experience (the
 * current design, untouched) or the desktop "v2" experience. We branch on the
 * *device* on purpose — not the viewport — because the requirement is "v2 only
 * on desktop, leave mobile exactly as is". Phones get mobile; tablets and
 * desktops get the desktop design.
 *
 * UA sniffing is imperfect (spoofing, odd browsers) but good enough here: a
 * wrong guess only swaps which equally-valid layout renders, never breaks data.
 */
const MOBILE_UA =
  /(Mobi|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini|Android.*Mobile)/i;

export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return MOBILE_UA.test(userAgent);
}
