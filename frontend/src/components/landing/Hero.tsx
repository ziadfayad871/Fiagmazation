"use client";

import Link from "next/link";
import {
  Circle,
  Frame,
  Hand,
  Image as ImageIcon,
  MessageSquare,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Type as TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AvatarStack } from "@/components/ui/Avatar";

const tools = [MousePointer2, Frame, TypeIcon, Pencil, Square, Circle, ImageIcon, MessageSquare, Hand];
const layerRows = [
  { label: "Frame 1", indent: 0, icon: Frame, active: false },
  { label: "Header", indent: 1, icon: Minus, active: false },
  { label: "Rectangle", indent: 1, icon: Square, active: true },
  { label: "Circle", indent: 1, icon: Circle, active: false },
  { label: "Text", indent: 1, icon: TypeIcon, active: false },
];

const people = [
  { id: "1", displayName: "Sara Khaled", color: "#7C3AED" },
  { id: "2", displayName: "Ahmed Nour", color: "#F5741F" },
  { id: "3", displayName: "Omar Ali", color: "#12B76A" },
  { id: "4", displayName: "Lina Said", color: "#EC4899" },
  { id: "5", displayName: "You", color: "#3B5BFE" },
];

function CursorChip({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <div className={`absolute flex items-start ${className ?? ""}`}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M3 2l14 6.6-6.2 1.7L8.6 17 3 2z" fill={color} stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <span
        className="-ml-1 mt-3 rounded-md px-2 py-1 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(16,24,40,0.2)]"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

function EditorPreview() {
  return (
    <div className="relative">
      <div className="rounded-xl border border-line bg-card shadow-[0_24px_60px_-24px_rgba(16,24,40,0.35)] overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-line-soft px-4 h-9">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>

        <div className="flex h-[330px] sm:h-[380px]">
          <div className="flex w-11 flex-col items-center gap-1 border-r border-line-soft py-2.5 bg-card">
            {tools.map((Icon, i) => (
              <span
                key={i}
                className={`flex size-7 items-center justify-center rounded-md ${
                  i === 0 ? "bg-brand-600 text-white" : "text-ink-400"
                }`}
              >
                <Icon className="size-3.5" />
              </span>
            ))}
          </div>

          <div className="canvas-dots relative flex-1">
            <div className="absolute left-[14%] top-[16%] h-[46%] w-[52%] rounded-md border border-brand-200 bg-card shadow-sm">
              <div className="absolute left-[8%] top-[14%] size-16 rounded-xl bg-flame-500 sm:size-20" />
              <div className="absolute left-[42%] top-[26%] h-24 w-16 rotate-6 rounded-md bg-grape-500 sm:h-28 sm:w-20" />
              <div className="absolute bottom-[12%] left-[20%] size-14 rounded-full bg-brand-600 sm:size-16" />
              <div className="absolute bottom-[16%] right-[10%] size-10 rounded-full bg-[#FF8FA3] sm:size-12" />
              <div className="absolute left-[8%] top-[6%] h-2 w-24 rounded-full bg-line" />
              <div className="absolute left-[8%] top-[calc(6%+10px)] h-2 w-16 rounded-full bg-line-soft" />
              <span className="absolute -inset-1.5 rounded-lg border border-brand-500/70" />
              <span className="absolute -left-1.5 -top-1.5 size-2 rounded-[2px] border border-brand-500 bg-card" />
              <span className="absolute -right-1.5 -top-1.5 size-2 rounded-[2px] border border-brand-500 bg-card" />
              <span className="absolute -bottom-1.5 -left-1.5 size-2 rounded-[2px] border border-brand-500 bg-card" />
              <span className="absolute -bottom-1.5 -right-1.5 size-2 rounded-[2px] border border-brand-500 bg-card" />
            </div>

            <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Other
            </span>

            <CursorChip name="Sara" color="#7C3AED" className="right-[6%] top-[18%]" />
            <CursorChip name="Ahmed" color="#F5741F" className="bottom-[14%] left-[38%]" />

            <span className="absolute bottom-4 left-5 font-hand text-2xl text-ink-900/80 -rotate-6">
              Better Together
            </span>
          </div>

          <div className="hidden w-[132px] border-l border-line-soft bg-card p-2.5 sm:block">
            <p className="mb-2 flex items-center justify-between text-[11px] font-bold text-ink-700">
              Layers
              <span className="text-ink-400">+</span>
            </p>
            <div className="space-y-0.5">
              {layerRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] ${
                    row.active ? "bg-brand-50 text-brand-700 dark:text-brand-300 font-semibold" : "text-ink-600"
                  }`}
                  style={{ paddingLeft: 6 + row.indent * 12 }}
                >
                  <row.icon className="size-3 shrink-0 text-ink-400" />
                  <span className="truncate">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 -top-5 size-14 rotate-12 rounded-lg bg-flame-500/90" />
      <div className="absolute -bottom-7 -left-6 size-20 rounded-full bg-brand-600/90" />
      <div className="absolute -bottom-4 right-10 hidden size-8 rounded-full bg-grape-500 sm:block" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rotate-45 rounded-[70px] bg-flame-500/95" />
      <div className="pointer-events-none absolute -left-32 bottom-[-140px] size-72 rounded-full bg-brand-600" />
      <div className="pointer-events-none absolute left-1/2 top-10 hidden size-4 rounded-full bg-danger lg:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_1fr] md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-ink-600">
            <span className="size-1.5 rounded-full bg-live" />
            Real-time collaborative canvas
          </span>
          <h1 className="mt-5 font-display text-[44px] font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
            Design Together,
            <br />
            <span className="text-flame-500">Create More.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-500">
            Fiagmazation is a modern collaborative design tool that brings your ideas to life. Work
            together in real-time, anywhere, anytime.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/#features">
              <Button size="lg" variant="secondary">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <AvatarStack people={people} max={4} size="sm" />
            <p className="text-[13px] leading-tight text-ink-500">
              Join thousands of creators
              <br />
              and teams worldwide
            </p>
          </div>
        </div>

        <div className="relative">
          <EditorPreview />
        </div>
      </div>
    </section>
  );
}
