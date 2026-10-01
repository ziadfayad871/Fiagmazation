"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

export function Tooltip({ label, children, side = "top" }: { label: string; children: ReactNode; side?: Side }) {
  const [visible, setVisible] = useState(false);
  const position =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
        : side === "right"
          ? "left-full top-1/2 -translate-y-1/2 ml-1.5"
          : "right-full top-1/2 -translate-y-1/2 mr-1.5";
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-[#101828] px-2 py-1 text-[11px] font-medium text-white shadow-pop animate-fade dark:bg-[#2a3140]",
            position,
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
