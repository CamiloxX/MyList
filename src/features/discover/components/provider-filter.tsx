"use client";

import { MonitorPlayIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { DiscoverProvider } from "../queries";

type Props = {
  providers: DiscoverProvider[];
  current: number | undefined;
};

/**
 * Streaming-provider dropdown. Driven by URL params so the SSR page can read
 * the value back; resets pagination on change.
 */
export function ProviderFilter({ providers, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.filters");
  const [, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("provider", value);
    } else {
      params.delete("provider");
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MonitorPlayIcon className="size-3.5" aria-hidden />
        {t("provider")}
      </span>
      <select
        value={current ?? ""}
        onChange={handleChange}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">{t("anyProvider")}</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </label>
  );
}
