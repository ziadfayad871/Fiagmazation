"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useToasts } from "@/store/toast";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const tones = {
  success: "text-live",
  error: "text-danger",
  info: "text-brand-600",
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            className="animate-pop flex items-start gap-2.5 rounded-lg border border-line bg-card px-3.5 py-3 shadow-pop"
          >
            <Icon className={cn("mt-0.5 size-4.5 shrink-0", tones[t.kind])} />
            <p className="flex-1 text-sm text-ink-700 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-ink-400 hover:text-ink-700"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
