"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Folder,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/rooms", label: "My Rooms", icon: Folder, exact: false },
  { href: "/dashboard/shared", label: "Shared With Me", icon: Users, exact: false },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate, exact: false },
];

const bottomItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuth((s) => s.logout);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  const body = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-[68px] items-center justify-between px-5">
        <Link href="/dashboard" onClick={onClose}>
          <Logo size={28} />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-ink-400 hover:bg-line-soft lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <nav className="mt-3 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white shadow-[0_2px_8px_-2px_rgba(59,91,254,0.7)]"
                  : "text-ink-600 hover:bg-line-soft hover:text-ink-900",
              )}
            >
              <item.icon className={cn("size-4.5", active ? "text-white" : "text-ink-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-line-soft px-3 py-4">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-line-soft hover:text-ink-900",
              )}
            >
              <item.icon className={cn("size-4.5", active ? "text-white" : "text-ink-400")} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-line-soft hover:text-ink-900"
        >
          <LogOut className="size-4.5 text-ink-400" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-line lg:block">{body}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#101828]/40 animate-fade dark:bg-black/60" onClick={onClose} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-card animate-pop">{body}</aside>
        </div>
      ) : null}
    </>
  );
}
