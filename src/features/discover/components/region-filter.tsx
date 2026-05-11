"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { DISCOVER_REGIONS, type DiscoverRegion } from "../schemas";

type Props = {
  current: DiscoverRegion;
};

/**
 * Country picker for the streaming-provider catalog. Changing the region
 * invalidates the chosen provider (Netflix's id is the same everywhere, but
 * other catalogs differ — safer to reset).
 */
export function RegionFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.filters");
  const [, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", value);
    params.delete("provider");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{t("region")}</span>
      <select
        value={current}
        onChange={handleChange}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {DISCOVER_REGIONS.map((code) => (
          <option key={code} value={code}>
            {t(`regions.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
