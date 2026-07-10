import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

// Hand-made chart primitives shared by /stats, the yearly comparison and the
// Wrapped cards. Server-Component friendly on purpose (no hooks, no state).

export function StatTile({
  Icon,
  value,
  label,
  iconClass,
}: {
  Icon: LucideIcon;
  value: number;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
      <span className={cn("flex size-9 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-2xl font-semibold leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate" title={item.label}>
            {item.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-2"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function KindHoursBar({
  hours,
  movieLabel,
  tvLabel,
  animeLabel,
}: {
  hours: { movie: number; tv: number; anime: number };
  movieLabel: string;
  tvLabel: string;
  animeLabel: string;
}) {
  const total = Math.max(0.0001, hours.movie + hours.tv + hours.anime);
  const segments = [
    { key: "movie", label: movieLabel, value: hours.movie, color: "bg-chart-1" },
    { key: "tv", label: tvLabel, value: hours.tv, color: "bg-chart-2" },
    { key: "anime", label: animeLabel, value: hours.anime, color: "bg-chart-4" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => {
          const pct = (segment.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={segment.key}
              className={segment.color}
              style={{ width: `${pct}%` }}
              title={`${segment.label}: ${segment.value} h`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span className={`inline-block size-2.5 rounded-sm ${segment.color}`} aria-hidden />
            <span className="font-medium">{segment.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{segment.value} h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyHint({ message }: { message: string }) {
  return <EmptyState title={message} size="sm" />;
}
