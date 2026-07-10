"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env/client";
import { sendTestPush, subscribeToPush, unsubscribeFromPush } from "../actions";
import { arrayBufferToBase64, urlBase64ToUint8Array } from "../push-key";

type PermState = "granted" | "denied" | "default" | "unsupported";

/**
 * Reports whether the browser can do Web Push at all. Safari on iOS only
 * exposes PushManager when the page is running as an installed PWA, so this
 * doubles as the "are we standalone?" check on Apple.
 */
function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function NotificationsToggle() {
  const t = useTranslations("settings.notifications");
  const [permission, setPermission] = useState<PermState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const vapidKey = clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!isSupported()) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermState);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(sub != null))
      .catch(() => setSubscribed(false));
  }, []);

  const handleSubscribe = () => {
    if (!vapidKey) {
      toast.error(t("errors.notConfigured"));
      return;
    }
    startTransition(async () => {
      try {
        const perm = await Notification.requestPermission();
        setPermission(perm as PermState);
        if (perm !== "granted") {
          toast.error(t("errors.permissionDenied"));
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        // PushManager.subscribe is idempotent — if there's already a sub for
        // this scope it returns it, so calling it on an already-subscribed
        // device just refreshes the keys.
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = sub.toJSON();
        const res = await subscribeToPush({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh")),
          auth: json.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth")),
          userAgent: navigator.userAgent.slice(0, 500),
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setSubscribed(true);
        toast.success(t("subscribed"));
      } catch (err) {
        console.warn("[notifications] subscribe failed", err);
        toast.error(t("errors.subscribeFailed"));
      }
    });
  };

  const handleUnsubscribe = () => {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeFromPush(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
        toast.success(t("unsubscribed"));
      } catch (err) {
        console.warn("[notifications] unsubscribe failed", err);
        toast.error(t("errors.unsubscribeFailed"));
      }
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      const res = await sendTestPush({
        title: t("test.title"),
        body: t("test.body"),
      });
      if (!res.ok) toast.error(res.error);
      else toast.success(t("test.sent"));
    });
  };

  if (permission === "unsupported") {
    return <p className="text-sm text-muted-foreground">{t("unsupported")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {!subscribed ? (
        <Button type="button" size="sm" onClick={handleSubscribe} disabled={isPending || !vapidKey}>
          {isPending ? t("subscribing") : t("subscribe")}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUnsubscribe}
            disabled={isPending}
          >
            {isPending ? t("unsubscribing") : t("unsubscribe")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleTest}
            disabled={isPending}
          >
            {t("test.button")}
          </Button>
        </div>
      )}
      {permission === "denied" ? (
        <p className="text-xs text-muted-foreground">{t("permissionDeniedHint")}</p>
      ) : null}
    </div>
  );
}
