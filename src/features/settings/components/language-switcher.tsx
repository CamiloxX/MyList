"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("settings.languages");

  const switchTo = (locale: Locale) => {
    if (locale === current) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {routing.locales.map((locale) => {
        const isActive = locale === current;
        return (
          <Button
            key={locale}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={isPending}
            onClick={() => switchTo(locale)}
            className={cn("min-w-[100px]")}
          >
            {t(locale)}
          </Button>
        );
      })}
    </div>
  );
}
