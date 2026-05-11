import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Tell next-intl which locale to use for the current request and which
 * messages to load. We only support `es` and `en` (see routing.ts); anything
 * else falls back to the default locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const isValid =
    typeof requested === "string" && (routing.locales as readonly string[]).includes(requested);
  const locale = isValid ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
