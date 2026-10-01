"use client";

import { useState, type DragEvent } from "react";
import {
  Circle,
  Eye,
  EyeOff,
  Frame,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Lock,
  LockOpen,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Type,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";
import type { ElementType } from "@/lib/types";

const typeIcon: Record<ElementType, React.ElementType> = {
  Rectangle: Square,
  Ellipse: Circle,
  Line: Minus,
  Pencil: Pencil,
  Text: Type,
  Image: ImageIcon,
  Frame: Frame,
};

export function LayersPanel() {
  const elements = useEditor((s) => s.elements);
  const selection = useEditor((s) => s.selection);
  const canEdit = useEditor((s) => s.canEdit);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || !canEdit) return;
    const visualIds = ordered.map((e) => e.id);
    const from = visualIds.indexOf(dragId);
    const to = visualIds.indexOf(targetId);
    if (from === -1 || to === -1) return;
    visualIds.splice(from, 1);
    visualIds.splice(to, 0, dragId);
    void useEditor.getState().reorder([...visualIds].reverse());
  };

  const commitRename = () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    const state = useEditor.getState();
    const element = state.elements.find((e) => e.id === renamingId);
    if (trimmed && element && trimmed !== element.name) {
      state.pushHistory();
      state.updateElement(renamingId, { name: trimmed }, { immediate: true });
    }
    setRenamingId(null);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    setOverId(id);
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
        <span className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
          <Layers className="size-4 text-ink-400" />
          Layers
        </span>
        <span className="rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-bold text-ink-500">
          {elements.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {ordered.length === 0 ? (
          <div className="px-3 py-8 text-center text-[13px] leading-relaxed text-ink-400">
            <MousePointer2 className="mx-auto mb-2 size-5" />
            No layers yet.
            <br />
            Pick a tool and draw.
          </div>
        ) : (
          ordered.map((el) => {
            const Icon = typeIcon[el.type] ?? Square;
            const selected = selection.includes(el.id);
            const renaming = renamingId === el.id;
            return (
              <div
                key={el.id}
                draggable={canEdit && !renaming}
                onDragStart={() => setDragId(el.id)}
                onDragOver={(e) => onDragOver(e, el.id)}
                onDragLeave={() => setOverId((id) => (id === el.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(el.id);
                  setDragId(null);
                  setOverId(null);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onClick={(e) => {
                  const state = useEditor.getState();
                  if (e.shiftKey) state.toggleSelect(el.id);
                  else state.select([el.id]);
                }}
                className={cn(
                  "group mb-0.5 flex cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-1.5 transition-colors",
                  selected ? "border-brand-200 bg-brand-50" : "border-transparent hover:bg-line-soft",
                  overId === el.id && dragId && dragId !== el.id && "border-t-2 border-t-brand-500",
                  !el.isVisible && "opacity-45",
                )}
              >
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-ink-400 opacity-0 group-hover:opacity-100" />
                <Icon className="size-3.5 shrink-0 text-ink-400" />
                {renaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 rounded border border-brand-400 px-1 py-0.5 text-xs font-medium outline-none"
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-medium text-ink-700"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!canEdit) return;
                      setRenamingId(el.id);
                      setRenameValue(el.name);
                    }}
                    title={el.name}
                  >
                    {el.name}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={el.isVisible ? "Hide layer" : "Show layer"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEdit) return;
                    const state = useEditor.getState();
                    state.pushHistory();
                    state.updateElement(el.id, { isVisible: !el.isVisible }, { immediate: true });
                  }}
                  className="rounded p-0.5 text-ink-400 hover:bg-card hover:text-ink-700"
                >
                  {el.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label={el.isLocked ? "Unlock layer" : "Lock layer"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEdit) return;
                    const state = useEditor.getState();
                    state.pushHistory();
                    state.updateElement(el.id, { isLocked: !el.isLocked }, { immediate: true });
                  }}
                  className={cn(
                    "rounded p-0.5 hover:bg-card",
                    el.isLocked ? "text-brand-600" : "text-ink-400 opacity-0 hover:text-ink-700 group-hover:opacity-100",
                  )}
                >
                  {el.isLocked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
