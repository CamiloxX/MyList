"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  type GrantUser,
  getGrantedBadgeIds,
  grantBadge,
  revokeBadge,
  searchUsersForGrant,
} from "../actions";
import type { AdminBadge } from "../queries";

export function GrantBadgesPanel({ badges }: { badges: AdminBadge[] }) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const [users, setUsers] = useState<GrantUser[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [selected, setSelected] = useState<GrantUser | null>(null);
  // Mirror of `selected.id` readable inside async callbacks, so a mutation that
  // resolves after the admin switched users doesn't touch the new user's state.
  const selectedRef = useRef<string | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loadingGranted, startLoadGranted] = useTransition();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startMutate] = useTransition();

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    startSearch(async () => {
      setUsers(await searchUsersForGrant(q));
    });
  }, [debounced]);

  const selectUser = (user: GrantUser) => {
    setSelected(user);
    selectedRef.current = user.id;
    setQuery("");
    setUsers([]);
    setPendingIds(new Set());
    startLoadGranted(async () => {
      setGranted(new Set(await getGrantedBadgeIds(user.id)));
    });
  };

  const clearUser = () => {
    setSelected(null);
    selectedRef.current = null;
    setGranted(new Set());
    setPendingIds(new Set());
  };

  const toggle = (badge: AdminBadge) => {
    if (!selected) return;
    const reqUser = selected.id;
    const has = granted.has(badge.id);
    setPendingIds((prev) => new Set(prev).add(badge.id));

    // Optimistic flip; revert on failure.
    setGranted((prev) => {
      const next = new Set(prev);
      if (has) next.delete(badge.id);
      else next.add(badge.id);
      return next;
    });

    startMutate(async () => {
      const result = has
        ? await revokeBadge(reqUser, badge.id)
        : await grantBadge(reqUser, badge.id);
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(badge.id);
        return next;
      });
      // The admin switched users while this was in flight: the checklist now
      // belongs to someone else — don't touch it or toast a stale result.
      if (selectedRef.current !== reqUser) return;
      if (!result.ok) {
        toast.error(result.error);
        setGranted((prev) => {
          const next = new Set(prev);
          if (has) next.add(badge.id);
          else next.delete(badge.id);
          return next;
        });
        return;
      }
      toast.success(has ? t("grant.revokedToast") : t("grant.grantedToast"));
    });
  };

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("grant.searchPlaceholder")}
            className="pl-9"
          />
          {isSearching ? (
            <Loader2Icon
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>

        {users.length > 0 ? (
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
            {users.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => selectUser(user)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                >
                  <Avatar src={user.avatarUrl} name={user.displayName ?? "?"} size="sm" />
                  <span className="min-w-0 truncate text-sm">
                    {user.displayName ?? t("grant.anonymous")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : debounced.trim().length >= 2 && !isSearching ? (
          <p className="text-xs text-muted-foreground">{t("grant.noResults")}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("grant.selectUserHint")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar src={selected.avatarUrl} name={selected.displayName ?? "?"} size="sm" />
          <span className="min-w-0 truncate text-sm font-medium">
            {selected.displayName ?? t("grant.anonymous")}
          </span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={clearUser} className="gap-1.5">
          <XIcon className="size-4" aria-hidden />
          {t("grant.changeUser")}
        </Button>
      </div>

      {badges.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("grant.noBadges")}</p>
      ) : (
        <ul className={cn("flex flex-col gap-1", loadingGranted && "opacity-60")}>
          {badges.map((badge) => {
            const has = granted.has(badge.id);
            const pending = pendingIds.has(badge.id);
            return (
              <li
                key={badge.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  <BadgeIcon
                    iconKey={badge.iconKey}
                    iconUrl={badge.iconUrl}
                    name={badge.name}
                    className="size-5"
                  />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">{badge.name}</span>
                <Button
                  type="button"
                  variant={has ? "outline" : "default"}
                  size="xs"
                  disabled={pending}
                  onClick={() => toggle(badge)}
                >
                  {pending ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : has ? (
                    t("grant.revoke")
                  ) : (
                    t("grant.grant")
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
