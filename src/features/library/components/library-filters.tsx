"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KIND_OPTIONS, STATUS_OPTIONS } from "../status";

type Group = "status" | "kind";

type Chip = {
  key: string;
  labelKey: string;
  param: Group;
  value: string | null;
};

const STATUS_CHIPS: Chip[] = [
  { key: "all-status", labelKey: "library.filters.all", param: "status", value: null },
  ...STATUS_OPTIONS.map((option) => ({
    key: `status-${option.value}`,
    labelKey: `statuses.${option.value}`,
    param: "status" as const,
    value: option.value,
  })),
];

const KIND_CHIPS: Chip[] = [
  { key: "all-kind", labelKey: "library.filters.all", param: "kind", value: null },
  ...KIND_OPTIONS.map((option) => ({
    key: `kind-${option.value}`,
    labelKey: `kinds.${option.value}`,
    param: "kind" as const,
    value: option.value,
  })),
];

export function LibraryFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const kind = searchParams.get("kind");
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3">
      <FilterRow
        label={t("library.filters.status")}
        chips={STATUS_CHIPS}
        current={status}
        pathname={pathname}
        searchParams={searchParams}
      />
      <FilterRow
        label={t("library.filters.kind")}
        chips={KIND_CHIPS}
        current={kind}
        pathname={pathname}
        searchParams={searchParams}
      />
    </div>
  );
}

type FilterRowProps = {
  label: string;
  chips: Chip[];
  current: string | null;
  pathname: string;
  searchParams: URLSearchParams;
};

function FilterRow({ label, chips, current, pathname, searchParams }: FilterRowProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      {chips.map((chip) => {
        const isActive = (current ?? null) === (chip.value ?? null);
        const href = buildFilterHref(pathname, searchParams, chip.param, chip.value);
        return (
          <Link key={chip.key} href={href}>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                !isActive && "hover:bg-secondary/80",
              )}
            >
              {t(chip.labelKey as "library.filters.all")}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}

function buildFilterHref(
  pathname: string,
  searchParams: URLSearchParams,
  param: Group,
  value: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (value === null) {
    params.delete(param);
  } else {
    params.set(param, value);
  }
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
