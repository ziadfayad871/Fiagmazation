"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#101828]/45 animate-fade dark:bg-black/60" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full bg-card rounded-xl shadow-pop animate-pop border border-line-soft",
          sizes[size],
          className,
        )}
      >
        {title || description ? (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
            <div>
              {title ? <h2 className="text-lg font-bold text-ink-900 font-display">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-ink-400 hover:text-ink-700 hover:bg-line-soft -mr-1.5"
            >
              <X className="size-4.5" />
            </button>
          </div>
        ) : null}
        <div className="px-6 py-4">{children}</div>
        {footer ? <div className="px-6 pb-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
