import { BadgeCheckIcon } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import type { BadgeDefinition } from "@/features/badges/types";
import { cn } from "@/lib/utils";

type AuthorAsideProps = {
  name: string | null;
  avatarUrl: string | null;
  badges: BadgeDefinition[];
  variant?: "sidebar" | "compact";
  fallbackLabel?: string;
  chip?: string | null;
  verified?: boolean;
  verifiedLabel?: string;
  verifiedChipLabel?: string;
  className?: string;
};

/**
 * Author profile block used by title CommentCard and the public profile header.
 * - `sidebar`: vertical column for sm:+ — avatar + name + badges grid.
 * - `compact`: horizontal row for mobile — avatar + name, with the badges on a
 *   second line under the name (the avatar grows when there are badges to show).
 */
export function AuthorAside({
  name,
  avatarUrl,
  badges,
  variant = "sidebar",
  fallbackLabel,
  chip,
  verified,
  verifiedLabel,
  verifiedChipLabel,
  className,
}: AuthorAsideProps) {
  const displayName = name?.trim() || fallbackLabel || "?";
  const visibleBadges = badges.slice(0, 4);

  if (variant === "compact") {
    const hasBadges = visibleBadges.length > 0;
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <Avatar src={avatarUrl} name={displayName} size={hasBadges ? "md" : "sm"} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-medium">{displayName}</span>
            {verified ? (
              <BadgeCheckIcon className="size-4 text-sky-500" aria-label={verifiedLabel} />
            ) : null}
            {verified && verifiedChipLabel ? (
              <span className="rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                {verifiedChipLabel}
              </span>
            ) : null}
            {chip ? (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {chip}
              </span>
            ) : null}
          </div>
          <BadgeRow badges={visibleBadges} />
        </div>
      </div>
    );
  }

  return (
    <aside className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <Avatar src={avatarUrl} name={displayName} size="lg" />
      <div className="flex flex-col items-center gap-0.5">
        <div className="inline-flex items-center justify-center gap-1">
          <span className="line-clamp-2 text-sm font-medium leading-tight">{displayName}</span>
          {verified ? (
            <BadgeCheckIcon className="size-4 shrink-0 text-sky-500" aria-label={verifiedLabel} />
          ) : null}
        </div>
        {verified && verifiedChipLabel ? (
          <span className="rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
            {verifiedChipLabel}
          </span>
        ) : null}
        {chip ? (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {chip}
          </span>
        ) : null}
      </div>
      <BadgeRow badges={visibleBadges} className="justify-center" />
    </aside>
  );
}

/**
 * The row of badge chips shown next to/under an author's name. An uploaded image
 * fills the circle; a Lucide glyph sits centered. Returns null when empty.
 */
function BadgeRow({ badges, className }: { badges: BadgeDefinition[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {badges.map((def) => (
        <li
          key={def.id}
          className={cn(
            "flex size-8 items-center justify-center overflow-hidden rounded-full border bg-background",
            badgeTierColor(def.tier),
          )}
          title={def.name}
        >
          <BadgeIcon
            iconKey={def.iconKey}
            iconUrl={def.iconUrl}
            name={def.name}
            className="size-5"
          />
        </li>
      ))}
    </ul>
  );
}

function badgeTierColor(tier: string): string {
  switch (tier) {
    case "gold":
      return "text-amber-500";
    case "silver":
      return "text-zinc-400";
    case "bronze":
    default:
      return "text-orange-600/80";
  }
}
