"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const QUERY_PARAM = "q";

export function LibrarySearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("library");
  const [, startTransition] = useTransition();

  const [value, setValue] = useState(defaultValue);
  const debounced = useDebouncedValue(value, 250);

  useEffect(() => {
    const current = searchParams.get(QUERY_PARAM) ?? "";
    if (debounced === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) {
      params.set(QUERY_PARAM, debounced);
    } else {
      params.delete(QUERY_PARAM);
    }
    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }, [debounced, pathname, router, searchParams]);

  return (
    <div className="relative">
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-10 pl-9 pr-9"
        aria-label={t("searchAria")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label={t("searchClear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
