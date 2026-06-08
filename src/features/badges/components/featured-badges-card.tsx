"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateFeaturedBadges } from "../actions";
import { type BadgeDefinition, MAX_FEATURED_BADGES } from "../types";
import { BadgeIcon } from "./badge-icon";

function sameArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Lets the user pick up to MAX_FEATURED_BADGES of their earned badges to
 * showcase next to their name in comment threads. Selection is optimistic.
 * Saves are serialized: only one request is in flight at a time and the latest
 * desired selection is coalesced, so rapid toggles can't drop a change or land
 * out of order. A failed save reverts to the last persisted selection.
 */
export function FeaturedBadgesCard({
  earned,
  initialFeatured,
}: {
  earned: BadgeDefinition[];
  initialFeatured: string[];
}) {
  const t = useTranslations("badges");
  const [, startTransition] = useTransition();

  const earnedIds = new Set(earned.map((b) => b.id));
  const initial = initialFeatured.filter((id) => earnedIds.has(id)).slice(0, MAX_FEATURED_BADGES);

  const [selected, setSelected] = useState<string[]>(initial);
  const desiredRef = useRef<string[]>(initial); // latest selection the user wants
  const savedRef = useRef<string[]>(initial); // last selection persisted OK
  const savingRef = useRef(false);

  const flush = () => {
    if (savingRef.current) return; // a save is in flight; it re-checks on finish
    const toSave = desiredRef.current;
    if (sameArray(toSave, savedRef.current)) return;
    savingRef.current = true;
    startTransition(async () => {
      const result = await updateFeaturedBadges(toSave);
      savingRef.current = false;
      if (result.ok) {
        savedRef.current = toSave;
        // The user changed the selection while this save was running — send it.
        if (!sameArray(desiredRef.current, toSave)) flush();
      } else {
        toast.error(result.error);
        desiredRef.current = savedRef.current;
        setSelected(savedRef.current);
      }
    });
  };

  const toggle = (id: string) => {
    const cur = desiredRef.current;
    let next: string[];
    if (cur.includes(id)) {
      next = cur.filter((x) => x !== id);
    } else if (cur.length >= MAX_FEATURED_BADGES) {
      toast(t("featured.maxReached", { max: MAX_FEATURED_BADGES }));
      return;
    } else {
      next = [...cur, id];
    }
    desiredRef.current = next;
    setSelected(next);
    flush();
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{t("featured.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("featured.description", { max: MAX_FEATURED_BADGES })}
        </p>
      </div>

      {earned.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("featured.empty")}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("featured.count", { n: selected.length, max: MAX_FEATURED_BADGES })}
          </p>
          <ul className="flex flex-wrap gap-2">
            {earned.map((badge) => {
              const isOn = selected.includes(badge.id);
              return (
                <li key={badge.id}>
                  <button
                    type="button"
                    onClick={() => toggle(badge.id)}
                    aria-pressed={isOn}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      isOn
                        ? "border-primary bg-primary/10 text-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <BadgeIcon
                        iconKey={badge.iconKey}
                        iconUrl={badge.iconUrl}
                        name={badge.name}
                        className="size-3.5"
                      />
                    </span>
                    <span className="max-w-[10rem] truncate">{badge.name}</span>
                    {isOn ? <CheckIcon className="size-3.5 text-primary" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
