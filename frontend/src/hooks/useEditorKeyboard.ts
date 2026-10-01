"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/store/toast";
import { useEditor } from "@/store/editor";
import { fitToScreen, zoomBy, zoomTo } from "@/lib/viewport";
import type { ToolType } from "@/lib/types";

const toolKeys: Record<string, ToolType> = {
  v: "select",
  h: "hand",
  f: "frame",
  r: "rectangle",
  o: "ellipse",
  l: "line",
  p: "pencil",
  t: "text",
  i: "image",
  c: "comment",
};

export function useEditorKeyboard(): void {
  const lastNudge = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useEditor.getState();
      if (state.status !== "ready") return;

      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        if (state.shortcutsOpen) {
          state.setShortcutsOpen(false);
          return;
        }
        if (state.contextMenu) {
          state.setContextMenu(null);
          return;
        }
        if (state.editingTextId) return;
        if (state.pendingComment) {
          state.setPendingComment(null);
          return;
        }
        state.clearSelection();
        return;
      }

      if (typing) return;

      if (mod) {
        const k = e.key.toLowerCase();
        if (k === "a") {
          e.preventDefault();
          state.selectAll();
        } else if (k === "c") {
          if (state.selection.length > 0) state.copySelected();
        } else if (k === "x") {
          if (state.selection.length > 0 && state.canEdit) {
            e.preventDefault();
            state.copySelected();
            void state.deleteSelected();
          }
        } else if (k === "v") {
          if (state.canEdit) {
            e.preventDefault();
            void state.pasteClipboard();
          }
        } else if (k === "d") {
          e.preventDefault();
          void state.duplicateSelected();
        } else if (k === "z") {
          e.preventDefault();
          if (e.shiftKey) state.redo();
          else state.undo();
        } else if (k === "y") {
          e.preventDefault();
          state.redo();
        } else if (k === "s") {
          e.preventDefault();
          void state.flushSave();
        } else if (k === "'") {
          e.preventDefault();
          state.toggleGrid();
        }
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (state.selection.length > 0 && state.canEdit) {
            e.preventDefault();
            void state.deleteSelected();
          }
          return;
        case "]":
          if (state.canEdit && state.selection.length > 0) void state.bringToFront();
          return;
        case "[":
          if (state.canEdit && state.selection.length > 0) void state.sendToBack();
          return;
        case "+":
        case "=":
          e.preventDefault();
          zoomBy(1.25);
          return;
        case "-":
        case "_":
          e.preventDefault();
          zoomBy(1 / 1.25);
          return;
        case "0":
          fitToScreen();
          return;
        case "1":
          zoomTo(1);
          return;
        case "?":
          state.setShortcutsOpen(true);
          return;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          if (!state.canEdit || state.selection.length === 0) return;
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          const now = Date.now();
          if (now - lastNudge.current > 600) state.pushHistory();
          lastNudge.current = now;
          const positions = state.elements
            .filter((el) => state.selection.includes(el.id))
            .map((el) => ({ id: el.id, x: el.x + dx, y: el.y + dy }));
          for (const pos of positions) {
            state.updateElement(pos.id, { x: pos.x, y: pos.y });
          }
          return;
        }
        default:
          break;
      }

      const tool = toolKeys[e.key.toLowerCase()];
      if (tool) {
        if (tool === "select" || tool === "hand" || tool === "comment") {
          state.setTool(tool);
        } else if (state.canEdit) {
          state.setTool(tool);
        } else {
          toast.info("Viewers can only select, pan, and comment");
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
