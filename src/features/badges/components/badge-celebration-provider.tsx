"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { BadgeDefinition } from "../types";
import { BadgeUnlockOverlay } from "./badge-unlock-overlay";

type Celebrate = (badges: BadgeDefinition[]) => void;

const BadgeCelebrationContext = createContext<Celebrate | null>(null);

/**
 * Wraps the authenticated app shell so any descendant client component can
 * trigger the "badge unlocked" celebration overlay via `useBadgeCelebrate`.
 *
 * Multiple badges queued by a single action play one after the other.
 */
export function BadgeCelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);

  const celebrate = useCallback<Celebrate>((badges) => {
    if (badges.length === 0) return;
    setQueue((q) => [...q, ...badges]);
  }, []);

  const dismissCurrent = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const current = queue[0];

  return (
    <BadgeCelebrationContext.Provider value={celebrate}>
      {children}
      {current ? (
        <BadgeUnlockOverlay key={current.id} badge={current} onDismiss={dismissCurrent} />
      ) : null}
    </BadgeCelebrationContext.Provider>
  );
}

export function useBadgeCelebrate(): Celebrate {
  const ctx = useContext(BadgeCelebrationContext);
  // Soft-fail: returning a no-op when the provider is missing keeps the calling
  // form/button working even if it's rendered outside the (app) shell.
  return ctx ?? (() => {});
}
