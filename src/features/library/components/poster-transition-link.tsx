"use client";

import { useLocale } from "next-intl";
import { Link } from "next-view-transitions";

/**
 * Locale-aware link that navigates through next-view-transitions so the shared
 * `view-transition-name` posters morph between the library list and the detail
 * page. We prepend the active locale because next-view-transitions' Link wraps
 * next/link directly (it doesn't know about next-intl's prefixing).
 */
export function PosterTransitionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const target = href.startsWith("/") ? `/${locale}${href}` : href;
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}
