import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
};

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
};

const TEXT_CLASS: Record<AvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Avatar({ src, name, size = "sm", className }: AvatarProps) {
  const px = SIZE_PX[size];
  const initialsText = initials(name ?? "");
  const explicitSize = {
    xs: "size-6",
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  }[size];

  if (src) {
    return (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-full bg-muted",
          explicitSize,
          className,
        )}
      >
        <Image
          src={src}
          alt={name ?? ""}
          fill
          sizes={`${px}px`}
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium uppercase text-muted-foreground",
        explicitSize,
        TEXT_CLASS[size],
        className,
      )}
      role="img"
      aria-label={name ?? "avatar"}
    >
      {initialsText || "?"}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0)).join("");
}
