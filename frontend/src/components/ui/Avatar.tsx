"use client";

import { cn, initials } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  src?: string | null;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  ring?: boolean;
  className?: string;
  title?: string;
}

const sizeMap = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
};

export function Avatar({ name, src, color = "#2563EB", size = "sm", ring, className, title }: AvatarProps) {
  return (
    <span
      title={title ?? name}
      style={src ? undefined : { backgroundColor: color }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        "border-2 border-white",
        ring && "ring-2 ring-white",
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
  size = "xs",
}: {
  people: { id: string; displayName: string; avatarUrl?: string | null; color?: string }[];
  max?: number;
  size?: "xs" | "sm";
}) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((p) => (
        <Avatar
          key={p.id}
          name={p.displayName}
          src={p.avatarUrl}
          color={p.color}
          size={size}
          ring
        />
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-line text-ink-600 border-2 border-white font-semibold",
            size === "xs" ? "size-6 text-[10px]" : "size-8 text-xs",
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
