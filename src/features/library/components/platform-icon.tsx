import { Film, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "../schemas";

type PlatformVisual = {
  bg: string;
  fg: string;
  label: ReactNode;
};

const PLATFORM_VISUALS: Record<Platform, PlatformVisual> = {
  Netflix: {
    bg: "bg-black",
    fg: "text-[#E50914]",
    label: <span className="font-extrabold tracking-tighter">N</span>,
  },
  "Prime Video": {
    bg: "bg-[#00A8E1]",
    fg: "text-white",
    label: <span className="font-bold italic">pv</span>,
  },
  "Disney+": {
    bg: "bg-[#0F1A2E]",
    fg: "text-white",
    label: <span className="font-semibold tracking-tight">D+</span>,
  },
  "HBO Max": {
    bg: "bg-[#0A0A2E]",
    fg: "text-white",
    label: <span className="text-[0.55rem] font-extrabold tracking-tight">HBO</span>,
  },
  "Apple TV+": {
    bg: "bg-black",
    fg: "text-white",
    label: <span className="text-[0.55rem] font-semibold">tv+</span>,
  },
  Crunchyroll: {
    bg: "bg-[#F47521]",
    fg: "text-white",
    label: <span className="font-extrabold">C</span>,
  },
  YouTube: {
    bg: "bg-[#FF0000]",
    fg: "text-white",
    label: <span className="font-bold leading-none">▶</span>,
  },
  Cine: {
    bg: "bg-zinc-800",
    fg: "text-amber-300",
    label: <Film className="size-3.5" />,
  },
  Otra: {
    bg: "bg-zinc-300 dark:bg-zinc-600",
    fg: "text-zinc-700 dark:text-zinc-200",
    label: <HelpCircle className="size-3.5" />,
  },
};

const SIZE_CLASS = {
  sm: "size-5 text-[0.65rem]",
  md: "size-6 text-xs",
  lg: "size-8 text-sm",
} as const;

export function PlatformIcon({
  platform,
  size = "md",
  className,
}: {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const visual = PLATFORM_VISUALS[platform as Platform] ?? PLATFORM_VISUALS.Otra;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-md leading-none",
        SIZE_CLASS[size],
        visual.bg,
        visual.fg,
        className,
      )}
    >
      {visual.label}
    </span>
  );
}
