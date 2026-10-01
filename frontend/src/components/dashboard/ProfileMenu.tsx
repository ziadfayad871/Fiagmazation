"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/auth";
import { colorForKey, cn } from "@/lib/utils";

export function ProfileMenu() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function onLogout() {
    setOpen(false);
    await logout();
    router.replace("/");
  }

  const items = [
    { label: "Profile", icon: User, href: "/dashboard/settings" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    { label: "Help", icon: CircleHelp, href: "/#about" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        <Avatar
          name={user.displayName || user.fullName}
          src={user.avatarUrl}
          color={colorForKey(user.id)}
          size="sm"
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#101828] p-1.5 shadow-pop animate-pop dark:bg-[#1c212c]">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar
              name={user.displayName || user.fullName}
              src={user.avatarUrl}
              color={colorForKey(user.id)}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.displayName || user.fullName}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/55">
                <span className="size-1.5 rounded-full bg-live" /> Online
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-white/10" />

          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon className="size-4 text-white/45" />
              {item.label}
            </Link>
          ))}

          <div className="my-1 h-px bg-white/10" />

          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium",
              "text-white/70 transition-colors hover:bg-white/10 hover:text-white",
            )}
          >
            <LogOut className="size-4 text-white/45" />
            Log Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
