"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import type { DesignElementDto } from "@/lib/types";

type AlignAction = "left" | "h-center" | "right" | "top" | "v-middle" | "bottom" | "dist-h" | "dist-v";

const ALIGN_BUTTONS: { action: AlignAction; icon: React.ElementType; label: string }[] = [
  { action: "left", icon: AlignStartVertical, label: "Align left" },
  { action: "h-center", icon: AlignCenterVertical, label: "Align horizontal centers" },
  { action: "right", icon: AlignEndVertical, label: "Align right" },
  { action: "top", icon: AlignStartHorizontal, label: "Align top" },
  { action: "v-middle", icon: AlignCenterHorizontal, label: "Align vertical centers" },
  { action: "bottom", icon: AlignEndHorizontal, label: "Align bottom" },
];

const DISTRIBUTE_BUTTONS: { action: AlignAction; icon: React.ElementType; label: string }[] = [
  { action: "dist-h", icon: AlignHorizontalDistributeCenter, label: "Distribute horizontally" },
  { action: "dist-v", icon: AlignVerticalDistributeCenter, label: "Distribute vertically" },
];

function computePositions(action: AlignAction, selected: DesignElementDto[]): { id: string; x: number; y: number }[] {
  const minX = Math.min(...selected.map((e) => e.x));
  const maxX = Math.max(...selected.map((e) => e.x + e.width));
  const minY = Math.min(...selected.map((e) => e.y));
  const maxY = Math.max(...selected.map((e) => e.y + e.height));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const next = selected.map((element) => ({ id: element.id, x: element.x, y: element.y }));

  switch (action) {
    case "left":
      for (const item of next) item.x = minX;
      break;
    case "h-center":
      selected.forEach((element, index) => {
        next[index].x = centerX - element.width / 2;
      });
      break;
    case "right":
      selected.forEach((element, index) => {
        next[index].x = maxX - element.width;
      });
      break;
    case "top":
      for (const item of next) item.y = minY;
      break;
    case "v-middle":
      selected.forEach((element, index) => {
        next[index].y = centerY - element.height / 2;
      });
      break;
    case "bottom":
      selected.forEach((element, index) => {
        next[index].y = maxY - element.height;
      });
      break;
    case "dist-h": {
      const sorted = selected
        .map((element, index) => ({ element, index }))
        .sort((a, b) => a.element.x - b.element.x);
      const total = sorted.reduce((sum, entry) => sum + entry.element.width, 0);
      const gap = (maxX - minX - total) / (sorted.length - 1);
      let cursor = minX;
      for (const entry of sorted) {
        next[entry.index].x = cursor;
        cursor += entry.element.width + gap;
      }
      break;
    }
    case "dist-v": {
      const sorted = selected
        .map((element, index) => ({ element, index }))
        .sort((a, b) => a.element.y - b.element.y);
      const total = sorted.reduce((sum, entry) => sum + entry.element.height, 0);
      const gap = (maxY - minY - total) / (sorted.length - 1);
      let cursor = minY;
      for (const entry of sorted) {
        next[entry.index].y = cursor;
        cursor += entry.element.height + gap;
      }
      break;
    }
    default:
      break;
  }

  return next;
}

function runAction(action: AlignAction): void {
  const state = useEditor.getState();
  if (!state.canEdit || state.selection.length < 2) return;
  if ((action === "dist-h" || action === "dist-v") && state.selection.length < 3) return;
  const selected = state.elements.filter((element) => state.selection.includes(element.id));
  if (selected.length < 2) return;

  const positions = computePositions(action, selected);
  const before = new Map(selected.map((element) => [element.id, element]));
  const changed = positions.filter((item) => {
    const element = before.get(item.id);
    return element && (item.x !== element.x || item.y !== element.y);
  });
  if (changed.length === 0) return;

  state.pushHistory();
  for (const item of changed) state.updateElement(item.id, { x: item.x, y: item.y });
  void state.flushBatch();
}

export function AlignToolbar() {
  const selection = useEditor((s) => s.selection);
  const canEdit = useEditor((s) => s.canEdit);

  if (!canEdit || selection.length < 2) return null;

  const canDistribute = selection.length >= 3;

  const btn =
    "flex size-7 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-line-soft hover:text-ink-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink-500";

  return (
    <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-line bg-card px-2 py-1.5 shadow-pop">
      {ALIGN_BUTTONS.map((item) => (
        <button
          key={item.action}
          type="button"
          aria-label={item.label}
          title={item.label}
          onClick={() => runAction(item.action)}
          className={btn}
        >
          <item.icon className="size-4" />
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-line" />
      {DISTRIBUTE_BUTTONS.map((item) => (
        <button
          key={item.action}
          type="button"
          aria-label={item.label}
          title={canDistribute ? item.label : `${item.label} (select 3 or more)`}
          disabled={!canDistribute}
          onClick={() => runAction(item.action)}
          className={btn}
        >
          <item.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
