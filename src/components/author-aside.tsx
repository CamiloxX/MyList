import { BADGE_BY_ID } from "@/features/badges/catalog";
import { BadgeIcon } from "@/features/badges/components/badge-icon";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

type AuthorAsideProps = {
  name: string | null;
  avatarUrl: string | null;
  badgeIds: string[];
  variant?: "sidebar" | "compact";
  fallbackLabel?: string;
  chip?: string | null;
  className?: string;
};

/**
 * Author profile block used by forum PostCard and title CommentCard.
 * - `sidebar`: vertical column for sm:+ — avatar + name + badges grid.
 * - `compact`: horizontal pill for mobile — avatar small + name only.
 */
export function AuthorAside({
  name,
  avatarUrl,
  badgeIds,
  variant = "sidebar",
  fallbackLabel,
  chip,
  className,
}: AuthorAsideProps) {
  const displayName = name?.trim() || fallbackLabel || "?";
  const visibleBadges = badgeIds.slice(0, 4);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar src={avatarUrl} name={displayName} size="sm" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium">{displayName}</span>
          {chip ? (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {chip}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn("flex flex-col items-center gap-2 text-center", className)}
    >
      <Avatar src={avatarUrl} name={displayName} size="lg" />
      <div className="flex flex-col items-center gap-0.5">
        <span className="line-clamp-2 text-sm font-medium leading-tight">{displayName}</span>
        {chip ? (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {chip}
          </span>
        ) : null}
      </div>
      {visibleBadges.length > 0 ? (
        <ul className="flex flex-wrap items-center justify-center gap-1">
          {visibleBadges.map((badgeId) => {
            const def = BADGE_BY_ID.get(badgeId);
            if (!def) return null;
            return (
              <li
                key={badgeId}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border bg-background",
                  badgeTierColor(def.tier),
                )}
                title={badgeId}
              >
                <BadgeIcon iconKey={def.iconKey} className="size-3.5" />
              </li>
            );
          })}
        </ul>
      ) : null}
    </aside>
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
