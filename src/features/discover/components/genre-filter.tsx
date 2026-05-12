"use client";

import { TagsIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { DiscoverGenre } from "../queries";

type Props = {
  genres: DiscoverGenre[];
  current: number | undefined;
};

/**
 * Native <select> driven by URL searchParams. Client component because it
 * mutates the URL on change; the actual data fetch happens server-side once
 * the new params are read by the page.
 */
export function GenreFilter({ genres, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("discover.filters");
  const [, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("genre", value);
    } else {
      params.delete("genre");
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <TagsIcon className="size-3.5" aria-hidden />
        {t("genre")}
      </span>
      <select
        value={current ?? ""}
        onChange={handleChange}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">{t("anyGenre")}</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </select>
    </label>
  );
}
