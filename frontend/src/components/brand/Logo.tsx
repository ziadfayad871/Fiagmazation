import { cn } from "@/lib/utils";

export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 4.5h7.4v23H7a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5Z" fill="#3B5BFE" />
      <path d="M14.4 4.5H26l-3.2 6.6H14.4V4.5Z" fill="#F5741F" />
      <path d="M14.4 14.2h7.9l-2.6 5.4h-5.3v-5.4Z" fill="#3B5BFE" />
      <path d="M7 4.5h7.4v6.6H7V4.5Z" fill="#2F49D8" />
    </svg>
  );
}

export function Logo({
  size = 30,
  withWord = true,
  className,
  wordClassName,
}: {
  size?: number;
  withWord?: boolean;
  className?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWord ? (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight text-ink-900 leading-none",
            wordClassName,
          )}
          style={{ fontSize: size * 0.62 }}
        >
          Fiagmazation
        </span>
      ) : null}
    </span>
  );
}
