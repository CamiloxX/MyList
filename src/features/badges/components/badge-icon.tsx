import {
  AwardIcon,
  BatteryWarningIcon,
  ClapperboardIcon,
  CompassIcon,
  FilmIcon,
  FlameIcon,
  HourglassIcon,
  MonitorPlayIcon,
  SparklesIcon,
  StarIcon,
  SwordIcon,
  SwordsIcon,
  TrophyIcon,
  TvIcon,
  ZapIcon,
} from "lucide-react";

const ICON_BY_KEY = {
  Sparkles: SparklesIcon,
  Film: FilmIcon,
  Tv: TvIcon,
  Sword: SwordIcon,
  Swords: SwordsIcon,
  Star: StarIcon,
  Zap: ZapIcon,
  Compass: CompassIcon,
  Flame: FlameIcon,
  Trophy: TrophyIcon,
  Clapperboard: ClapperboardIcon,
  MonitorPlay: MonitorPlayIcon,
  Award: AwardIcon,
  BatteryWarning: BatteryWarningIcon,
  Hourglass: HourglassIcon,
} as const;

export type BadgeIconKey = keyof typeof ICON_BY_KEY;

/**
 * Renders a badge's icon: an uploaded image when `iconUrl` is set (admin-created
 * badges), otherwise the Lucide icon named by `iconKey` (built-ins). Falls back
 * to a trophy when neither resolves.
 *
 * An uploaded image FILLS its (sized, rounded) parent box via `size-full
 * object-cover` so it auto-fits the badge circle regardless of its dimensions —
 * `className` only sizes the Lucide glyph, which is intentionally smaller than
 * the circle. Every caller wraps BadgeIcon in a fixed-size container.
 */
export function BadgeIcon({
  iconKey,
  iconUrl,
  name,
  className,
}: {
  iconKey?: string | null;
  iconUrl?: string | null;
  name?: string;
  className?: string;
}) {
  if (iconUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: user-uploaded badge art on an arbitrary Supabase URL; next/image would need per-host config.
      <img
        src={iconUrl}
        alt={name ?? ""}
        className="size-full object-cover"
        loading="lazy"
        aria-hidden={name ? undefined : true}
      />
    );
  }
  const Icon = ICON_BY_KEY[iconKey as BadgeIconKey] ?? TrophyIcon;
  return <Icon className={className} aria-hidden />;
}
