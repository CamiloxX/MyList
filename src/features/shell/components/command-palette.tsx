"use client";

import {
  BarChart3Icon,
  CalendarIcon,
  CalendarRangeIcon,
  CompassIcon,
  CornerDownLeftIcon,
  LibraryIcon,
  type LucideIcon,
  NewspaperIcon,
  SearchIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Destination = { href: string; labelKey: string; Icon: LucideIcon };

// Mirrors the app's primary + secondary navigation so the palette is a fast
// keyboard route to anywhere. Labels reuse the existing `nav.*` messages.
const DESTINATIONS: readonly Destination[] = [
  { href: "/library", labelKey: "library", Icon: LibraryIcon },
  { href: "/search", labelKey: "search", Icon: SearchIcon },
  { href: "/discover", labelKey: "discover", Icon: CompassIcon },
  { href: "/month", labelKey: "month", Icon: CalendarIcon },
  { href: "/year", labelKey: "year", Icon: CalendarRangeIcon },
  { href: "/stats", labelKey: "stats", Icon: BarChart3Icon },
  { href: "/badges", labelKey: "badges", Icon: TrophyIcon },
  { href: "/settings", labelKey: "settings", Icon: SettingsIcon },
  { href: "/changelog", labelKey: "changelog", Icon: NewspaperIcon },
] as const;

/**
 * Global command palette opened with ⌘K / Ctrl+K. Lets the user jump to any
 * section or kick off a search, all from the keyboard. Mounted once in the
 * locale layout.
 */
export function CommandPalette() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Move focus into the search field once the dialog has opened.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const trimmed = query.trim();
  const destinations = useMemo(() => {
    const q = trimmed.toLowerCase();
    return DESTINATIONS.filter((d) => !q || tNav(d.labelKey).toLowerCase().includes(q));
  }, [trimmed, tNav]);

  // Flat item list: an optional "search for X" action, then matching routes.
  const items = useMemo(() => {
    const list: Array<{ key: string; run: () => void; render: () => React.ReactNode }> = [];
    if (trimmed) {
      list.push({
        key: "search",
        run: () => router.push({ pathname: "/search", query: { q: trimmed } }),
        render: () => (
          <>
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 truncate">{t("command.searchFor", { query: trimmed })}</span>
          </>
        ),
      });
    }
    for (const d of destinations) {
      list.push({
        key: d.href,
        run: () => router.push(d.href),
        render: () => (
          <>
            <d.Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 truncate">{tNav(d.labelKey)}</span>
          </>
        ),
      });
    }
    return list;
  }, [trimmed, destinations, router, t, tNav]);

  // Keep the highlighted row valid as the list shrinks/grows.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const activate = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      close();
      item.run();
    },
    [items, close],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(activeIndex);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setActiveIndex(0);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("command.placeholder")}
            className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("command.empty")}
            </li>
          ) : (
            items.map((item, index) => (
              <li key={item.key}>
                <button
                  type="button"
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => activate(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex ? "bg-muted text-foreground" : "text-foreground/80",
                  )}
                >
                  {item.render()}
                  {index === activeIndex ? (
                    <CornerDownLeftIcon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
