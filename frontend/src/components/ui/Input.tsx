"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputBase =
  "w-full bg-card border border-line rounded-lg text-sm text-ink-900 placeholder:text-ink-400 " +
  "transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none " +
  "disabled:bg-surface disabled:text-ink-400";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, trailing, invalid, ...rest },
  ref,
) {
  const field = (
    <input
      ref={ref}
      className={cn(
        inputBase,
        "h-11 px-3.5",
        icon ? "pl-10" : "",
        trailing ? "pr-10" : "",
        invalid && "border-danger focus:border-danger focus:ring-red-100",
        className,
      )}
      {...rest}
    />
  );

  if (!icon && !trailing) return field;

  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-ink-400">
          {icon}
        </span>
      ) : null}
      {field}
      {trailing ? (
        <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-400">
          {trailing}
        </span>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        inputBase,
        "px-3.5 py-2.5 min-h-20 resize-none",
        invalid && "border-danger focus:border-danger focus:ring-red-100",
        className,
      )}
      {...rest}
    />
  );
});

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink-700 mb-1.5">
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[13px] text-danger">{message}</p>;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      <FieldError message={error} />
      {!error && hint ? <p className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
