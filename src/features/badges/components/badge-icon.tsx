import {
  CompassIcon,
  FilmIcon,
  FlameIcon,
  SparklesIcon,
  StarIcon,
  SwordIcon,
  TrophyIcon,
  TvIcon,
  ZapIcon,
} from "lucide-react";

const ICON_BY_KEY = {
  Sparkles: SparklesIcon,
  Film: FilmIcon,
  Tv: TvIcon,
  Sword: SwordIcon,
  Star: StarIcon,
  Zap: ZapIcon,
  Compass: CompassIcon,
  Flame: FlameIcon,
  Trophy: TrophyIcon,
} as const;

export type BadgeIconKey = keyof typeof ICON_BY_KEY;

export function BadgeIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = ICON_BY_KEY[iconKey as BadgeIconKey] ?? TrophyIcon;
  return <Icon className={className} aria-hidden />;
}
