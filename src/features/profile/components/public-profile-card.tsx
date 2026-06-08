"use client";

import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { setProfilePublic, updateUsername } from "../actions";
import { USERNAME_MAX } from "../schemas";

type Props = {
  currentUsername: string | null;
  currentIsPublic: boolean;
};

/**
 * Settings card to claim a public @handle and opt the profile in/out of being
 * publicly visible at /u/<handle>. The handle save and the visibility toggle
 * are independent actions; going public requires a saved handle first (enforced
 * server-side, surfaced here as a toast).
 */
export function PublicProfileCard({ currentUsername, currentIsPublic }: Props) {
  const t = useTranslations("profile.handle");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(currentUsername ?? "");
  const [savedUsername, setSavedUsername] = useState<string | null>(currentUsername);
  const [isPublic, setIsPublic] = useState(currentIsPublic);
  const [copied, setCopied] = useState(false);
  const [isSavingHandle, startSaveHandle] = useTransition();
  const [isToggling, startToggle] = useTransition();

  const trimmed = value.trim();
  const handleChanged = trimmed !== (savedUsername ?? "");

  const onSubmitHandle = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed.length === 0 || !handleChanged) return;
    startSaveHandle(async () => {
      const result = await updateUsername({ username: value });
      if (result.ok) {
        setSavedUsername(result.username);
        setValue(result.username);
        toast.success(t("successToast"));
        router.refresh();
        return;
      }
      toast.error(t(`errors.${result.errorKey}`));
    });
  };

  const onToggle = () => {
    if (!savedUsername) {
      toast.error(t("errors.needHandleFirst"));
      return;
    }
    const next = !isPublic;
    setIsPublic(next); // optimistic
    startToggle(async () => {
      const result = await setProfilePublic(next);
      if (!result.ok) {
        setIsPublic(!next); // revert
        toast.error(t(`errors.${result.errorKey}`));
        return;
      }
      router.refresh();
    });
  };

  const onCopy = async () => {
    if (!savedUsername) return;
    const url = `${window.location.origin}/${locale}/u/${savedUsername}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("errors.failed"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmitHandle} className="flex flex-col gap-1.5">
        <Label htmlFor="username">{t("label")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            >
              @
            </span>
            <Input
              id="username"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={USERNAME_MAX}
              placeholder={t("placeholder")}
              value={value}
              disabled={isSavingHandle}
              // Live-normalize to the allowed charset so the field always shows
              // what will actually be stored (lowercase, no spaces).
              onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              className="pl-7"
            />
          </div>
          <Button type="submit" disabled={isSavingHandle || !handleChanged || trimmed.length === 0}>
            {isSavingHandle ? t("saving") : t("save")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </form>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("publicToggle")}</span>
          <span className="text-xs text-muted-foreground">{t("publicHint")}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label={t("publicToggle")}
          disabled={isToggling}
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            isPublic ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 transform rounded-full bg-background shadow transition-transform",
              isPublic ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {isPublic && savedUsername ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
          <Link
            href={`/u/${savedUsername}`}
            className="flex items-center gap-1.5 truncate text-sm text-primary hover:underline"
          >
            <Share2Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">/u/{savedUsername}</span>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <CheckIcon className="size-4" aria-hidden />
            ) : (
              <CopyIcon className="size-4" aria-hidden />
            )}
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
