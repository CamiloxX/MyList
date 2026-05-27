"use client";

import { DownloadIcon, Share2Icon } from "lucide-react";
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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

/**
 * Mobile-only install entrypoint shown in the app header. Two flavors:
 * - Chromium (Android Chrome/Edge): captures `beforeinstallprompt` and uses
 *   the native install prompt when the user taps the button.
 * - iOS Safari: there's no programmatic install API, so we open a sheet
 *   with the manual steps (Share → Add to Home Screen).
 *
 * The button disappears entirely when the app is already running as a PWA
 * (display-mode: standalone) or when the OS doesn't surface the prompt.
 */
export function InstallPwaButton() {
  const t = useTranslations("pwa");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    // Detect *real* iOS Safari (Chrome iOS uses WebKit too but `crios` UA).
    // On those, beforeinstallprompt never fires AND share→add-to-home doesn't
    // exist either — they need to switch to Safari first.
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIos(isIosDevice);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isInstalled) return null;

  if (isIos) {
    return (
      <Drawer>
        <DrawerTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t("install")}
            />
          }
        >
          <DownloadIcon className="size-5" aria-hidden />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("iosTitle")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6">
            <p className="text-sm text-muted-foreground">{t("iosIntro")}</p>
            <ol className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </span>
                <span>{t("iosStep1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  2
                </span>
                <span className="flex flex-1 flex-wrap items-center gap-1.5">
                  {t("iosStep2")}
                  <Share2Icon className="inline size-4 text-muted-foreground" aria-hidden />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  3
                </span>
                <span>{t("iosStep3")}</span>
              </li>
            </ol>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!installEvent) return null;

  const handleInstall = async () => {
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstallEvent(null);
      }
    } catch {
      // User dismissed before the prompt resolved — nothing to do.
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={handleInstall}
      aria-label={t("install")}
    >
      <DownloadIcon className="size-5" aria-hidden />
    </Button>
  );
}
