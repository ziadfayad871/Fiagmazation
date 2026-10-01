import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col items-center justify-center gap-2 py-10 text-center"
          : "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 py-14 text-center"
      }
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-card border border-line text-brand-600">
        <Icon className="size-5.5" />
      </span>
      <div>
        <p className="font-semibold text-ink-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-ink-500 max-w-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
