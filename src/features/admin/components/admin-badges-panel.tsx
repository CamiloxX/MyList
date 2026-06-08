"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminBadge } from "../queries";
import { BadgeAdminCard } from "./badge-admin-card";
import { BadgeFormDrawer } from "./badge-form-drawer";

export function AdminBadgesPanel({ badges }: { badges: AdminBadge[] }) {
  const t = useTranslations("admin");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminBadge | null>(null);

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (badge: AdminBadge) => {
    setEditTarget(badge);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("badges.count", { n: badges.length })}</p>
        <Button type="button" size="sm" onClick={openCreate} className="gap-2">
          <PlusIcon className="size-4" aria-hidden />
          {t("badges.create")}
        </Button>
      </div>

      {badges.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
          {t("badges.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {badges.map((badge) => (
            <BadgeAdminCard key={badge.id} badge={badge} onEdit={openEdit} />
          ))}
        </div>
      )}

      <BadgeFormDrawer open={formOpen} onOpenChange={setFormOpen} badge={editTarget} />
    </div>
  );
}
