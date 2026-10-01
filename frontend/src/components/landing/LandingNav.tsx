"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
const links = [
  { href: "/#features", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-card/95 backdrop-blur-none">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Fiagmazation home">
          <Logo size={30} />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l, i) => (
            <a
              key={`${l.label}-${i}`}
              href={l.href}
              className="text-sm font-medium text-ink-700 hover:text-brand-600 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="secondary" size="sm" className="h-9 px-4 rounded-lg">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="h-9 px-4 rounded-lg">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-ink-700 hover:bg-line-soft"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line-soft bg-card px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l, i) => (
              <a
                key={`m-${l.label}-${i}`}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink-700"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="flex-1">
                <Button variant="secondary" block>
                  Log in
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button block>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
