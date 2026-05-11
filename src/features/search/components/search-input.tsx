"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const QUERY_PARAM = "q";

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("search");
  const [, startTransition] = useTransition();

  const [value, setValue] = useState(defaultValue);
  const debounced = useDebouncedValue(value, 300);

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
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }, [debounced, pathname, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={t("placeholder")}
      autoFocus
      className="h-11"
    />
  );
}
