"use client";

import { Grid3x3, Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useEditor } from "@/store/editor";
import { fitToScreen, zoomBy, zoomTo } from "@/lib/viewport";
import { cn } from "@/lib/utils";

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-white/15" />;
}

export function ZoomBar() {
  const zoom = useEditor((s) => s.zoom);
  const gridVisible = useEditor((s) => s.gridVisible);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const canEdit = useEditor((s) => s.canEdit);
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);

  const btn =
    "flex size-8 items-center justify-center rounded-md text-white/75 transition-colors hover:bg-white/12 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/10 bg-[#101828]/95 px-2 py-1.5 shadow-pop dark:bg-[#171b24]/95">
      <button type="button" className={btn} onClick={undo} disabled={!canEdit || past.length === 0} aria-label="Undo">
        <Undo2 className="size-4" />
      </button>
      <button type="button" className={btn} onClick={redo} disabled={!canEdit || future.length === 0} aria-label="Redo">
        <Redo2 className="size-4" />
      </button>
      <Divider />
      <button type="button" className={btn} onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        className={cn(btn, "w-14 text-[12px] font-semibold tabular-nums")}
        onClick={() => zoomTo(1)}
        aria-label="Reset zoom to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" className={btn} onClick={() => zoomBy(1.25)} aria-label="Zoom in">
        <Plus className="size-4" />
      </button>
      <Divider />
      <button type="button" className={btn} onClick={fitToScreen} aria-label="Fit to screen">
        <Maximize className="size-4" />
      </button>
      <button
        type="button"
        className={cn(btn, gridVisible && "bg-white/12 text-white")}
        onClick={toggleGrid}
        aria-label="Toggle grid"
        aria-pressed={gridVisible}
      >
        <Grid3x3 className="size-4" />
      </button>
    </div>
  );
}
