"use client";

import { Link2Icon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BadgeTitleResult, resolveTitleFromLibrary } from "../actions";

/**
 * Alternative to the text search in the badge title pickers: paste a library
 * link (…/library/<id>) or a raw id and resolve the exact title from your
 * library — handy when the typeahead can't find an anime/series by name. The
 * `accept` callback lets a picker reject a resolved title whose kind it can't
 * use (e.g. a non-tv title for the season picker) by returning an error string.
 */
export function LibraryLinkInput({
  onResolved,
  accept,
}: {
  onResolved: (result: BadgeTitleResult) => void;
  accept?: (result: BadgeTitleResult) => string | null;
}) {
  const t = useTranslations("admin");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const detect = () => {
    if (!value.trim()) return;
    setError(null);
    start(async () => {
      const res = await resolveTitleFromLibrary(value);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const rejection = accept?.(res.data);
      if (rejection) {
        setError(rejection);
        return;
      }
      onResolved(res.data);
      setValue("");
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                detect();
              }
            }}
            placeholder={t("condition.linkPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detect}
          disabled={isPending || !value.trim()}
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : (
            t("condition.linkDetect")
          )}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
