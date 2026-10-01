"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquare, Share2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { cn, colorForKey, formatTime } from "@/lib/utils";
import type { NotificationDto } from "@/lib/types";

const typeMeta: Record<string, { icon: typeof Bell; tone: string }> = {
  RoomShared: { icon: Share2, tone: "bg-brand-50 text-brand-600" },
  MemberJoined: { icon: UserPlus, tone: "bg-emerald-50 text-live" },
  CommentAdded: { icon: MessageSquare, tone: "bg-violet-50 text-grape-500" },
  CommentReply: { icon: MessageSquare, tone: "bg-violet-50 text-grape-500" },
};

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);

  function safeLinkPath(url: string): string | null {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    try {
      const parsed = new URL(url);
      if (parsed.origin === window.location.origin) return `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
    return null;
  }

  async function load() {
    try {
      const [list, count] = await Promise.all([
        api.get<NotificationDto[]>("/notifications"),
        api.get<number>("/notifications/unread-count"),
      ]);
      setItems(list);
      setUnread(count);
    } catch {
      /* keep whatever we have */
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function markRead(id: string, linkUrl: string | null) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      /* non-critical */
    }
    if (linkUrl) {
      setOpen(false);
      const path = safeLinkPath(linkUrl);
      if (path) router.push(path);
    }
  }

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await api.post("/notifications/read-all");
    } catch {
      /* non-critical */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg border transition-colors",
          open ? "border-line bg-line-soft text-ink-900" : "border-line bg-card text-ink-600 hover:bg-surface",
        )}
      >
        <Bell className="size-4.5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-line bg-card shadow-pop animate-pop">
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <p className="text-sm font-bold text-ink-900">Notifications</p>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={markAll}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto panel-scroll">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto size-5 text-ink-400" />
                  <p className="mt-2 text-sm font-medium text-ink-700">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs text-ink-400">Shares, comments and invites land here.</p>
                </div>
              ) : (
                items.map((n) => {
                  const meta = typeMeta[n.type] ?? { icon: Bell, tone: "bg-surface text-ink-500" };
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n.id, n.linkUrl)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                        !n.isRead && "bg-brand-50/50",
                      )}
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-ink-900">{n.title}</span>
                          {!n.isRead ? <span className="size-1.5 shrink-0 rounded-full bg-brand-600" /> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-500">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-ink-400">{formatTime(n.createdAt)}</span>
                      </span>
                      {n.actor ? (
                        <Avatar
                          name={n.actor.displayName}
                          src={n.actor.avatarUrl}
                          color={n.actor.color || colorForKey(n.actor.id)}
                          size="xs"
                        />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
