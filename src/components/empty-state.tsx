import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Already-translated title; callers own the i18n keys. */
  title: string;
  description?: string;
  /** Optional icon rendered above the title. */
  icon?: ReactNode;
  /** Optional CTA (a Link or Button) rendered below the text. */
  action?: ReactNode;
  /** "md" for full-page states, "sm" for tighter in-card states. */
  size?: "md" | "sm";
  className?: string;
};

/**
 * Shared dashed-border empty state. Server-Component friendly (no state, no
 * handlers) — pass any interactivity through `action`.
 */
export function EmptyState({ title, description, icon, action, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed text-center",
        size === "md" ? "p-12" : "p-6",
        className,
      )}
    >
      {icon}
      <p className="text-sm text-muted-foreground">{title}</p>
      {description ? <p className="text-xs text-muted-foreground/80">{description}</p> : null}
      {action}
    </div>
  );
}
