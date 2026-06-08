"use client";

import { EyeIcon, EyeOffIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import type { BadgeCriterion, BadgeTier } from "@/features/badges/types";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { deleteBadge, toggleBadgeActive } from "../actions";
import type { AdminBadge } from "../queries";

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
  silver: "from-slate-400/20 to-slate-400/5 text-slate-600 dark:text-slate-300",
  gold: "from-yellow-400/30 to-yellow-400/5 text-yellow-600 dark:text-yellow-400",
};

/** Human summary of a criterion for the card subtitle. */
function useCriterionSummary(): (c: BadgeCriterion) => string {
  const t = useTranslations("admin");
  return (c) => {
    switch (c.kind) {
      case "manual":
        return t("condition.kinds.manual");
      case "title_season":
        return t("summary.titleSeason", { season: c.season, id: c.sourceId });
      case "title_completed":
        return t("summary.titleCompleted", { title: c.title ?? `#${c.sourceId}` });
      case "title_episodes":
        return t("summary.titleEpisodes", { title: c.title ?? `#${c.sourceId}`, n: c.episodes });
      case "media_completed_count":
        return t("summary.mediaCompleted", {
          n: c.target,
          kind: t(`condition.mediaKinds.${c.mediaKind}`),
        });
      default:
        return t(`summary.${c.kind}`, { n: c.target });
    }
  };
}

export function BadgeAdminCard({
  badge,
  onEdit,
}: {
  badge: AdminBadge;
  onEdit: (badge: AdminBadge) => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const summarize = useCriterionSummary();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const result = await toggleBadgeActive(badge.id, !badge.isActive);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMenuOpen(false);
      toast.success(badge.isActive ? t("toast.deactivated") : t("toast.activated"));
      router.refresh();
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteBadge(badge.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("toast.deleted"));
      router.refresh();
    });
  };

  return (
    <article
      className={cn(
        "relative flex items-start gap-3 rounded-xl border bg-card p-4",
        !badge.isActive && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
          TIER_STYLES[badge.tier],
        )}
      >
        <BadgeIcon
          iconKey={badge.iconKey}
          iconUrl={badge.iconUrl}
          name={badge.name}
          className="size-6"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium leading-tight">{badge.name}</h3>
          {!badge.isActive ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {t("inactive")}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{badge.description}</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
          {summarize(badge.criterion)}
        </p>
      </div>

      <Popover
        open={menuOpen}
        onOpenChange={(o) => {
          setMenuOpen(o);
          if (!o) setConfirmDelete(false);
        }}
      >
        <PopoverTrigger
          aria-label={t("card.menu")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        >
          <MoreVerticalIcon className="size-4" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 p-1">
              <p className="text-sm text-muted-foreground">{t("card.confirmDelete")}</p>
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isPending}
                  onClick={() => setConfirmDelete(false)}
                >
                  {t("form.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  disabled={isPending}
                  onClick={onDelete}
                >
                  {t("card.delete")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(badge);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <PencilIcon className="size-4 text-muted-foreground" aria-hidden />
                {t("card.edit")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={onToggle}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                {badge.isActive ? (
                  <EyeOffIcon className="size-4 text-muted-foreground" aria-hidden />
                ) : (
                  <EyeIcon className="size-4 text-muted-foreground" aria-hidden />
                )}
                {badge.isActive ? t("card.deactivate") : t("card.activate")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2Icon className="size-4" aria-hidden />
                {t("card.delete")}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </article>
  );
}
