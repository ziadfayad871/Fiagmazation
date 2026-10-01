"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

function Decor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-10 -top-12 size-32 rotate-[28deg] rounded-[42px] bg-flame-500/90" />
      <div className="pointer-events-none absolute right-16 top-24 hidden size-6 rotate-12 rounded-md bg-grape-500 lg:block" />
      <div className="pointer-events-none absolute -bottom-16 -left-14 size-44 rounded-full bg-brand-600/90" />
      <div className="pointer-events-none absolute bottom-10 left-6 hidden size-3 rounded-full bg-danger lg:block" />
    </>
  );
}

export function AuthShell({
  children,
  split,
}: {
  children: ReactNode;
  split?: boolean;
}) {
  if (split) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex items-center justify-center overflow-hidden px-5 py-12">
          <Decor />
          <div className="relative w-full max-w-[430px]">{children}</div>
        </div>
        <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
          <div className="absolute inset-0 canvas-dots opacity-60" />
          <div className="absolute left-[12%] top-[14%] h-40 w-56 rounded-lg border border-line bg-card shadow-[0_16px_40px_-20px_rgba(16,24,40,0.4)]">
            <div className="absolute left-5 top-5 size-14 rounded-xl bg-flame-500" />
            <div className="absolute right-6 top-8 h-20 w-14 rotate-6 rounded-md bg-grape-500" />
            <div className="absolute bottom-5 left-10 size-12 rounded-full bg-brand-600" />
          </div>
          <div className="absolute bottom-[18%] right-[12%] size-24 rounded-full bg-brand-600/90" />
          <div className="absolute right-[26%] top-[38%] size-10 rotate-12 rounded-lg bg-flame-500" />
          <p className="absolute bottom-16 left-14 font-hand text-5xl leading-tight text-ink-900 -rotate-6">
            Big ideas
            <br />
            Build Together
            <span className="ml-3 inline-block">↗</span>
          </p>
        </aside>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <Decor />
      <div className="relative w-full max-w-[420px]">{children}</div>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <>
      <Link href="/" className="inline-block">
        <Logo size={30} />
      </Link>
      <h1 className="mt-7 font-display text-[26px] font-extrabold tracking-tight text-ink-900">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
      <div className="mt-7">{children}</div>
      <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
    </>
  );
}
