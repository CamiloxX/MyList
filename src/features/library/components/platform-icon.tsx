import {
  SiAppletv,
  SiMax,
  SiNetflix,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Film, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Platform } from "../schemas";

type PlatformVisual = {
  bg: string;
  fg: string;
  label: (iconSize: number) => ReactNode;
};

// Brand logos. simple-icons covers Netflix/Max/Apple TV+/YouTube cleanly;
// Crunchyroll, Prime Video and Disney+ are not in any open-source icon set
// (license-restricted), so they're inlined here as SVG approximations of
// the official app-icon look.
const PLATFORM_VISUALS: Record<Platform, PlatformVisual> = {
  Netflix: {
    bg: "bg-black",
    fg: "",
    label: (s) => <SiNetflix size={s} color="#E50914" />,
  },
  "Prime Video": {
    bg: "",
    fg: "",
    label: () => <PrimeVideoLogo />,
  },
  "Disney+": {
    bg: "",
    fg: "",
    label: () => <DisneyPlusLogo />,
  },
  "HBO Max": {
    bg: "bg-black",
    fg: "",
    label: (s) => <SiMax size={s} color="#fff" />,
  },
  "Apple TV+": {
    bg: "bg-black",
    fg: "",
    label: (s) => <SiAppletv size={s} color="#fff" />,
  },
  Crunchyroll: {
    bg: "",
    fg: "",
    label: () => <CrunchyrollLogo />,
  },
  YouTube: {
    bg: "bg-white",
    fg: "",
    label: (s) => <SiYoutube size={s} color="#FF0000" />,
  },
  Cine: {
    bg: "bg-zinc-800",
    fg: "text-amber-300",
    label: () => <Film className="size-3.5" />,
  },
  Otra: {
    bg: "bg-zinc-300 dark:bg-zinc-600",
    fg: "text-zinc-700 dark:text-zinc-200",
    label: () => <HelpCircle className="size-3.5" />,
  },
};

const SIZE_CLASS = {
  sm: "size-5 text-[0.65rem]",
  md: "size-6 text-xs",
  lg: "size-8 text-sm",
} as const;

const ICON_PIXELS = {
  sm: 12,
  md: 14,
  lg: 18,
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
  const isInlineLogo = !visual.bg;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-md leading-none",
        SIZE_CLASS[size],
        visual.bg,
        visual.fg,
        className,
      )}
    >
      {isInlineLogo ? (
        // Inline brand SVGs paint their own background; fill the chip fully.
        <span className="size-full">{visual.label(ICON_PIXELS[size])}</span>
      ) : (
        visual.label(ICON_PIXELS[size])
      )}
    </span>
  );
}

function CrunchyrollLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="5" fill="#F47521" />
      <path
        d="M16.6 8.6a5 5 0 1 0 0 6.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrimeVideoLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="3" fill="#00A8E1" />
      <text
        x="12"
        y="13"
        textAnchor="middle"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontSize="7"
        fontStyle="italic"
        fontWeight="900"
      >
        prime
      </text>
      <path
        d="M4.5 17.5 Q 12 21 19.5 17.5"
        stroke="#fff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DisneyPlusLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="3" fill="#0C162C" />
      <text
        x="8.5"
        y="17"
        fill="#fff"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="14"
      >
        D
      </text>
      <text
        x="15.5"
        y="14"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="10"
      >
        +
      </text>
    </svg>
  );
}
