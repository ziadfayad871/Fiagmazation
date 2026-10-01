"use client";

import { useEffect, useRef } from "react";
import {
  BringToFront,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  MessageSquarePlus,
  SendToBack,
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";

interface MenuItemDef {
  label: string;
  icon: React.ElementType;
  onSelect: () => void | Promise<void>;
  show?: boolean;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export function ContextMenu() {
  const menu = useEditor((s) => s.contextMenu);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) return;
      useEditor.getState().setContextMenu(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") useEditor.getState().setContextMenu(null);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  if (!menu) return null;
  const state = useEditor.getState();
  const target = menu.targetId ? state.elements.find((e) => e.id === menu.targetId) : null;
  const hasSelection = state.selection.length > 0;
  const canEdit = state.canEdit;

  const selectTarget = () => {
    if (target && !state.selection.includes(target.id)) state.select([target.id]);
  };

  const items: MenuItemDef[] = [
    {
      label: "Copy",
      icon: Copy,
      shortcut: "Ctrl+C",
      show: hasSelection,
      onSelect: () => state.copySelected(),
    },
    {
      label: "Paste",
      icon: ClipboardPaste,
      shortcut: "Ctrl+V",
      show: !target,
      disabled: !canEdit,
      onSelect: () => void state.pasteClipboard(),
    },
    {
      label: "Duplicate",
      icon: Copy,
      shortcut: "Ctrl+D",
      show: hasSelection,
      disabled: !canEdit,
      onSelect: () => void state.duplicateSelected(),
    },
    {
      label: "Add comment here",
      icon: MessageSquarePlus,
      show: !target,
      onSelect: () => {
        const container = document.getElementById("editor-canvas");
        if (!container) return;
        const s = useEditor.getState();
        s.setPendingComment({ x: (menu.x - s.panX) / s.zoom, y: (menu.y - s.panY) / s.zoom });
      },
    },
    {
      label: target?.isVisible === false ? "Show layer" : "Hide layer",
      icon: target?.isVisible === false ? Eye : EyeOff,
      show: Boolean(target),
      disabled: !canEdit,
      onSelect: () => {
        selectTarget();
        if (target) {
          state.pushHistory();
          state.updateElement(target.id, { isVisible: !target.isVisible }, { immediate: true });
        }
      },
    },
    {
      label: target?.isLocked ? "Unlock layer" : "Lock layer",
      icon: target?.isLocked ? LockOpen : Lock,
      show: Boolean(target),
      disabled: !canEdit,
      onSelect: () => {
        selectTarget();
        if (target) {
          state.pushHistory();
          state.updateElement(target.id, { isLocked: !target.isLocked }, { immediate: true });
        }
      },
    },
    {
      label: "Bring to front",
      icon: BringToFront,
      shortcut: "]",
      show: hasSelection,
      disabled: !canEdit,
      onSelect: () => void state.bringToFront(),
    },
    {
      label: "Send to back",
      icon: SendToBack,
      shortcut: "[",
      show: hasSelection,
      disabled: !canEdit,
      onSelect: () => void state.sendToBack(),
    },
    {
      label: "Delete",
      icon: Trash2,
      shortcut: "Del",
      show: hasSelection,
      danger: true,
      disabled: !canEdit,
      onSelect: () => void state.deleteSelected(),
    },
  ];

  const visible = items.filter((i) => i.show !== false);
  if (visible.length === 0) return null;

  const container = document.getElementById("editor-canvas");
  const rect = container?.getBoundingClientRect();
  const flipX = rect ? menu.x > rect.width - 210 : false;
  const flipY = rect ? menu.y > rect.height - (visible.length * 34 + 16) : false;

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-50 w-52 rounded-lg border border-line bg-card p-1 shadow-pop animate-pop"
      style={{
        left: flipX ? undefined : menu.x,
        right: flipX && rect ? rect.width - menu.x : undefined,
        top: flipY ? undefined : menu.y,
        bottom: flipY && rect ? rect.height - menu.y : undefined,
      }}
    >
      {visible.map((item, index) => (
        <div key={item.label}>
          {index > 0 && item.label === "Delete" ? <div className="my-1 h-px bg-line-soft" /> : null}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              void item.onSelect();
              useEditor.getState().setContextMenu(null);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              "disabled:pointer-events-none disabled:opacity-40",
              item.danger ? "text-danger hover:bg-red-50" : "text-ink-700 hover:bg-line-soft",
            )}
          >
            <item.icon className="size-3.5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut ? <span className="text-[11px] text-ink-400">{item.shortcut}</span> : null}
          </button>
        </div>
      ))}
    </div>
  );
}
