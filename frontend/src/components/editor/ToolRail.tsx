"use client";

import {
  Circle,
  Frame,
  Hand,
  Image as ImageIcon,
  MessageSquare,
  Minus,
  MousePointer,
  Pencil,
  Square,
  Type,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useEditor } from "@/store/editor";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/lib/types";

const tools: { id: ToolType; label: string; key: string; icon: React.ElementType; needsEdit?: boolean }[] = [
  { id: "select", label: "Select", key: "V", icon: MousePointer },
  { id: "hand", label: "Hand (pan)", key: "H", icon: Hand },
  { id: "frame", label: "Frame", key: "F", icon: Frame, needsEdit: true },
  { id: "rectangle", label: "Rectangle", key: "R", icon: Square, needsEdit: true },
  { id: "ellipse", label: "Ellipse", key: "O", icon: Circle, needsEdit: true },
  { id: "line", label: "Line", key: "L", icon: Minus, needsEdit: true },
  { id: "pencil", label: "Pencil", key: "P", icon: Pencil, needsEdit: true },
  { id: "text", label: "Text", key: "T", icon: Type, needsEdit: true },
  { id: "image", label: "Image", key: "I", icon: ImageIcon, needsEdit: true },
  { id: "comment", label: "Comment", key: "C", icon: MessageSquare },
];

export function ToolRail() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const canEdit = useEditor((s) => s.canEdit);

  return (
    <div className="absolute left-3 top-3 z-30 flex flex-col gap-1 rounded-lg border border-line bg-card p-1.5 shadow-pop">
      {tools.map((item) => {
        const disabled = Boolean(item.needsEdit) && !canEdit;
        const active = tool === item.id;
        return (
          <Tooltip key={item.id} label={`${item.label}  ${item.key}`} side="right">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setTool(item.id)}
              aria-label={item.label}
              aria-pressed={active}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors",
                "focus-visible:outline-2 focus-visible:outline-brand-500",
                disabled && "cursor-not-allowed opacity-35",
                active
                  ? "bg-brand-600 text-white shadow-[0_2px_6px_rgba(59,91,254,0.5)]"
                  : "text-ink-500 hover:bg-line-soft hover:text-ink-900",
              )}
            >
              <item.icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
