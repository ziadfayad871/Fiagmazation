"use client";

import { Clock, MessageSquare, Radio, SlidersHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CommentsPanel } from "./CommentsPanel";
import { HistoryPanel } from "./HistoryPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";

function PresenceSection() {
  const presence = useEditor((s) => s.presence);
  const users = Object.values(presence);

  return (
    <div className="border-t border-line bg-surface px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">
        <Radio className="size-3.5 text-live" />
        Live collaboration
        <span className="ml-auto flex items-center gap-1 text-live">
          <span className="size-1.5 rounded-full bg-live animate-pulse" />
          {users.length}
        </span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {users.slice(0, 6).map((user) => (
          <li key={user.userId} className="flex items-center gap-2">
            <Avatar name={user.displayName} src={user.avatarUrl} color={user.color} size="xs" />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink-700">
              {user.displayName}
            </span>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: user.color }} />
          </li>
        ))}
      </ul>
      {users.length > 6 ? <p className="mt-1.5 text-[11px] text-ink-400">+{users.length - 6} more online</p> : null}
    </div>
  );
}

export function RightPanel() {
  const rightTab = useEditor((s) => s.rightTab);
  const setRightTab = useEditor((s) => s.setRightTab);
  const comments = useEditor((s) => s.comments);
  const openCount = comments.filter((c) => !c.parentId && !c.resolved).length;

  const tabCls = (active: boolean, grow = true) =>
    cn(
      "flex items-center justify-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-bold transition-colors",
      grow && "flex-1",
      active ? "border-brand-600 text-brand-600" : "border-transparent text-ink-500 hover:text-ink-800",
    );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-card">
      <div className="flex">
        <button type="button" className={tabCls(rightTab === "design")} onClick={() => setRightTab("design")}>
          <SlidersHorizontal className="size-4" />
          Design
        </button>
        <button type="button" className={tabCls(rightTab === "comments")} onClick={() => setRightTab("comments")}>
          <MessageSquare className="size-4" />
          Comments
          {openCount > 0 ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                rightTab === "comments" ? "bg-brand-50 text-brand-600" : "bg-line-soft text-ink-500",
              )}
            >
              {openCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={tabCls(rightTab === "history", false)}
          onClick={() => setRightTab("history")}
          aria-label="Version history"
          title="Version history"
        >
          <Clock className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {rightTab === "design" ? (
          <PropertiesPanel />
        ) : rightTab === "history" ? (
          <HistoryPanel />
        ) : (
          <CommentsPanel />
        )}
      </div>

      <PresenceSection />
    </aside>
  );
}
