"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Layer, Rect, Stage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { ShapeNode } from "@/components/editor/Canvas";
import { api, ApiError } from "@/lib/api";
import { useEditor } from "@/store/editor";
import { toast } from "@/store/toast";
import type { DesignDto, DesignElementDto } from "@/lib/types";

interface PresentDesign {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: DesignElementDto[];
}

const PAD = 64;

function closePresent(): void {
  useEditor.getState().setPresentOpen(false);
}

function toPresentDesign(design: DesignDto): PresentDesign {
  return {
    id: design.id,
    name: design.name,
    width: design.width,
    height: design.height,
    backgroundColor: design.backgroundColor,
    elements: [...design.elements].sort((a, b) => a.zIndex - b.zIndex),
  };
}

export function PresentOverlay() {
  const open = useEditor((s) => s.presentOpen);

  const [trail, setTrail] = useState<PresentDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef(new Map<string, HTMLImageElement>());

  const current = trail.length > 0 ? trail[trail.length - 1] : null;

  useEffect(() => {
    if (!open) {
      setTrail([]);
      setImages({});
      return;
    }
    const state = useEditor.getState();
    setTrail([
      {
        id: state.designId ?? "",
        name: state.designName,
        width: state.designWidth,
        height: state.designHeight,
        backgroundColor: state.designBackground,
        elements: [...state.elements].sort((a, b) => a.zIndex - b.zIndex),
      },
    ]);
    setImages({});
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closePresent();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) });
    });
    observer.observe(container);
    setSize({ width: container.clientWidth, height: container.clientHeight });
    return () => observer.disconnect();
  }, [open]);

  const imageKey = useMemo(
    () =>
      current
        ? JSON.stringify(current.elements.filter((e) => e.type === "Image" && e.src).map((e) => ({ id: e.id, src: e.src })))
        : "",
    [current],
  );

  useEffect(() => {
    if (!imageKey) return;
    const entries = JSON.parse(imageKey) as { id: string; src: string | null }[];
    let cancelled = false;
    for (const entry of entries) {
      if (!entry.src) continue;
      const cached = imageCache.current.get(entry.src);
      if (cached) {
        if (!cancelled) setImages((prev) => ({ ...prev, [entry.id]: cached }));
        continue;
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        imageCache.current.set(entry.src as string, image);
        if (cancelled) return;
        setImages((prev) => ({ ...prev, [entry.id]: image }));
      };
      image.src = entry.src;
    }
    return () => {
      cancelled = true;
    };
  }, [imageKey]);

  async function navigate(targetId: string) {
    if (loading) return;
    setLoading(true);
    try {
      const design = await api.get<DesignDto>(`/designs/${targetId}`);
      setTrail((prev) => [...prev, toPresentDesign(design)]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open that page");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setTrail((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  const handlePointerDown = (event: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
    if (event.evt.type !== "click" || !current) return;
    const element = current.elements.find((e) => e.id === id);
    if (!element?.linkToDesignId) return;
    event.cancelBubble = true;
    void navigate(element.linkToDesignId);
  };

  const handleMove = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = event.target.getStage();
    if (!stage || !current) return;
    const id = event.target.id();
    const linked = id ? current.elements.some((e) => e.id === id && Boolean(e.linkToDesignId)) : false;
    stage.container().style.cursor = linked ? "pointer" : "default";
  };

  if (!open || !current) return null;

  const scale = Math.max(
    Math.min((size.width - PAD * 2) / current.width, (size.height - PAD * 2) / current.height),
    0.02,
  );
  const offsetX = (size.width - current.width * scale) / 2;
  const offsetY = (size.height - current.height * scale) / 2;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-black/70 px-4 py-2.5">
        <button
          type="button"
          aria-label="Back"
          disabled={trail.length <= 1}
          onClick={goBack}
          className="flex size-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{current.name}</span>
        {loading ? <Loader2 className="size-4 animate-spin text-white/60" /> : null}
        <span className="hidden text-[12px] font-semibold text-white/45 sm:inline">Press Esc to exit</span>
        <button
          type="button"
          aria-label="Exit present"
          onClick={closePresent}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
          Exit present
        </button>
      </div>

      <div ref={containerRef} className="absolute inset-0">
        {size.width > 0 && size.height > 0 ? (
          <Stage
            width={size.width}
            height={size.height}
            x={offsetX}
            y={offsetY}
            scaleX={scale}
            scaleY={scale}
            onMouseMove={handleMove}
            style={{ cursor: "default" }}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={current.width}
                height={current.height}
                fill={current.backgroundColor}
                listening={false}
              />
              {current.elements.map((element) => (
                <ShapeNode
                  key={element.id}
                  element={element}
                  image={images[element.id]}
                  tool="select"
                  canEdit={false}
                  onPointerDown={handlePointerDown}
                  onContextMenu={() => undefined}
                  onDragStart={() => undefined}
                  onDragMove={() => undefined}
                  onDragEnd={() => undefined}
                  onTransformEnd={() => undefined}
                  onDblClick={() => undefined}
                  registerRef={() => undefined}
                />
              ))}
            </Layer>
          </Stage>
        ) : null}
      </div>
    </div>
  );
}
