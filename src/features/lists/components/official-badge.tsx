import { BadgeCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The verified/official marker shown next to an official list's name. Reuses the
 * sky-blue check used elsewhere for admins (chat, comments) so "trusted" reads
 * consistently across the app.
 */
export function OfficialBadge({ label, className }: { label: string; className?: string }) {
  return (
    <BadgeCheckIcon className={cn("size-4 shrink-0 text-sky-500", className)} aria-label={label} />
  );
}
