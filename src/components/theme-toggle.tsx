"use client";

import { CheckIcon, LaptopIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "mylist-theme";

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; Icon: LucideIcon }> = [
  { value: "light", Icon: SunIcon },
  { value: "dark", Icon: MoonIcon },
  { value: "system", Icon: LaptopIcon },
];

/**
 * Tri-state theme picker: light / dark / system. State is persisted in
 * localStorage under `mylist-theme`; `system` removes the key so the OS
 * preference takes over via @media (prefers-color-scheme).
 *
 * An inline script in [locale]/layout applies the stored class to <html>
 * BEFORE first paint, so this component just keeps state in sync — no
 * FOUC on page load.
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (next === "light") root.classList.add("light");
    if (next === "dark") root.classList.add("dark");
    if (next === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
    setOpen(false);
  };

  // Render a neutral placeholder during SSR/hydration to avoid mismatch.
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-hidden
        tabIndex={-1}
        className="opacity-0"
      >
        <LaptopIcon className="size-5" />
      </Button>
    );
  }

  const ActiveIcon = THEME_OPTIONS.find((o) => o.value === theme)?.Icon ?? LaptopIcon;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button type="button" variant="ghost" size="icon" aria-label={t("toggleLabel")} />
        }
      >
        <ActiveIcon className="size-5" aria-hidden />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
        </DrawerHeader>
        <ul className="flex flex-col gap-1 pb-2">
          {THEME_OPTIONS.map(({ value, Icon }) => {
            const isActive = value === theme;
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent active:bg-accent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium">{t(`options.${value}`)}</span>
                  {isActive ? <CheckIcon className="size-4 text-primary" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
