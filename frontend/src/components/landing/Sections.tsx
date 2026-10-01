import Link from "next/link";
import {
  ArrowRight,
  Cloud,
  Keyboard,
  Layers,
  MessageSquare,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: MousePointerClick,
    tone: "bg-brand-50 text-brand-600",
    title: "Live multiplayer editing",
    body: "See every cursor, selection and edit the moment it happens. No refreshes, no merge conflicts, no waiting.",
  },
  {
    icon: Layers,
    tone: "bg-flame-50 text-flame-600",
    title: "Layers that make sense",
    body: "Rename, reorder, lock and hide layers in a tree that mirrors exactly what is on your canvas.",
  },
  {
    icon: MessageSquare,
    tone: "bg-violet-50 text-grape-500",
    title: "Comments in context",
    body: "Drop a pin where the feedback belongs, reply in threads and resolve when the work is done.",
  },
  {
    icon: ShieldCheck,
    tone: "bg-red-50 text-danger",
    title: "Viewer & editor roles",
    body: "Share a room with a link, invite by email and decide who can edit and who can only look around.",
  },
  {
    icon: Cloud,
    tone: "bg-emerald-50 text-live",
    title: "Autosave you can trust",
    body: "Every change is persisted to the server within seconds. Watch it flip from Saving to Saved.",
  },
  {
    icon: Keyboard,
    tone: "bg-brand-50 text-brand-600",
    title: "Built for keyboard flow",
    body: "Draw, select, duplicate and undo with the shortcuts you already know from your favourite tools.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-line-soft bg-surface/70">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Features</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
            Everything a design team needs, nothing it doesn&apos;t.
          </h2>
          <p className="mt-3 text-[15px] text-ink-500">
            A focused toolset: a fast canvas, honest collaboration and the plumbing that keeps your
            work safe.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-lg border border-line bg-card p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,0.25)]"
            >
              <span className={cn("flex size-10 items-center justify-center rounded-lg", f.tone)}>
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    title: "Create a room",
    body: "Name the space for your project — a landing page, an app flow, a brand board. It is ready in one click.",
  },
  {
    n: "02",
    title: "Invite your team",
    body: "Share the room link or invite by email. Editors shape the file, viewers follow along in real time.",
  },
  {
    n: "03",
    title: "Design in the open",
    body: "Draw, comment, resolve, repeat. Everything autosaves and everyone sees the same canvas.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-line-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1.2fr] md:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-flame-500">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">
            From blank canvas to shared decision.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            Fiagmazation keeps the loop tight: draw it, show it, discuss it — all inside one room
            with one source of truth.
          </p>
          <Link href="/register" className="mt-6 inline-flex">
            <Button>
              Start a room
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <ol className="space-y-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-5 rounded-lg border border-line bg-card p-5"
            >
              <span className="font-display text-2xl font-extrabold text-brand-600/35">{s.n}</span>
              <div>
                <h3 className="font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    blurb: "For individuals exploring ideas.",
    features: ["3 rooms", "Unlimited viewers", "Core drawing tools", "Autosave & history"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/editor/mo",
    blurb: "For designers who ship every week.",
    features: [
      "Unlimited rooms",
      "Comments & version history",
      "Custom fonts & exports",
      "Duplicate templates",
    ],
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/editor/mo",
    blurb: "For product teams working in sync.",
    features: ["Everything in Pro", "Roles & permissions", "Shared team libraries", "Priority support"],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-line-soft bg-surface/70">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
            Simple plans, honest limits.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "relative rounded-lg border bg-card p-6",
                p.highlighted ? "border-brand-600 shadow-[0_12px_32px_-16px_rgba(59,91,254,0.6)]" : "border-line",
              )}
            >
              {p.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">
                  Most popular
                </span>
              ) : null}
              <h3 className="font-semibold text-ink-900">{p.name}</h3>
              <p className="mt-3 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">
                  {p.price}
                </span>
                <span className="pb-1 text-sm text-ink-500">{p.period}</span>
              </p>
              <p className="mt-2 text-sm text-ink-500">{p.blurb}</p>
              <ul className="mt-5 space-y-2.5 border-t border-line-soft pt-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-6 block">
                <Button variant={p.highlighted ? "primary" : "secondary"} block>
                  Get started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="border-t border-line-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-grape-500">About</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">
            A design tool should disappear behind the work.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            We built Fiagmazation around a simple belief: teams move fastest when everyone is
            looking at the same canvas, at the same time, with the same context. So we focused on a
            fast editor, real presence and storage that never loses your work.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { k: "Multiplayer", v: "Cursors, selections and edits streamed live over SignalR." },
            { k: "Durable", v: "Every change persisted to SQL Server within seconds." },
            { k: "Permissioned", v: "Owner, editor and viewer roles enforced on the server." },
            { k: "Keyboard-first", v: "The shortcuts you know, wired to real commands." },
          ].map((item) => (
            <div key={item.k} className="rounded-lg border border-line bg-card p-5">
              <p className="font-display text-lg font-extrabold text-ink-900">{item.k}</p>
              <p className="mt-1.5 text-sm text-ink-500">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line-soft bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size={28} />
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            A modern collaborative design tool that brings your ideas to life.
          </p>
        </div>
        {[
          { title: "Product", links: [["Features", "/#features"], ["Pricing", "/#pricing"], ["Editor", "/register"]] },
          { title: "Company", links: [["About", "/#about"], ["Careers", "/#about"], ["Contact", "/#about"]] },
          { title: "Get started", links: [["Log in", "/login"], ["Create account", "/register"], ["Dashboard", "/login"]] },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-ink-900">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-ink-500 hover:text-brand-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Fiagmazation. All rights reserved.</p>
          <p>Made for teams that design out loud.</p>
        </div>
      </div>
    </footer>
  );
}
