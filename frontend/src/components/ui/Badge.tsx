import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "orange" | "purple" | "red" | "gray";

const tones: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-700 border-brand-100 dark:text-brand-300 dark:border-brand-500/30",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:text-emerald-300 dark:border-emerald-500/30",
  orange: "bg-flame-50 text-flame-700 border-flame-100 dark:text-flame-300 dark:border-flame-500/30",
  purple: "bg-violet-50 text-violet-700 border-violet-100 dark:text-violet-300 dark:border-violet-500/30",
  red: "bg-red-50 text-red-600 border-red-100 dark:text-red-300 dark:border-red-500/30",
  gray: "bg-surface text-ink-600 border-line",
};

export function Badge({
  children,
  tone = "gray",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
