"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Ellipse, Layer, Line, Rect, Image as KImage, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { clamp, cn } from "@/lib/utils";
import { resolveCanvasFontStack } from "@/lib/fonts";
import { bindEditorStage } from "@/lib/stageRef";
import { useEditor } from "@/store/editor";
import { toast } from "@/store/toast";
import { apiFetch, ApiError } from "@/lib/api";
import { ContextMenu } from "./ContextMenu";
import type { DesignElementDto, ElementType } from "@/lib/types";

interface Vec {
  x: number;
  y: number;
}

function parsePoints(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
}

const fontWeightMap: Record<string, string> = {
  Light: "300",
  Regular: "400",
  Medium: "500",
  Semibold: "600",
  Bold: "700",
  Extrabold: "800",
};

function isSafeImageSrc(src: string): boolean {
  return (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:image/")
  );
}

export interface ShapeProps {
  element: DesignElementDto;
  image?: HTMLImageElement;
  tool: string;
  canEdit: boolean;
  onPointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => void;
  onContextMenu: (event: KonvaEventObject<PointerEvent>, id: string) => void;
  onDragStart: (event: KonvaEventObject<DragEvent>, id: string) => void;
  onDragMove: (event: KonvaEventObject<DragEvent>, id: string) => void;
  onDragEnd: (event: KonvaEventObject<DragEvent>, id: string) => void;
  onTransformEnd: (event: KonvaEventObject<Event>, id: string) => void;
  onDblClick: (id: string) => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
}

export const ShapeNode = memo(function ShapeNode({
  element,
  image,
  tool,
  canEdit,
  onPointerDown,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  onDblClick,
  registerRef,
}: ShapeProps) {
  const el = element;
  const draggable = tool === "select" && canEdit && !el.isLocked && el.isVisible;
  const opacity = el.opacity;
  const rotation = el.rotation;
  const shared = {
    id: el.id,
    opacity,
    rotation,
    visible: el.isVisible,
    draggable,
    listening: el.isVisible && !el.isLocked,
    ref: (node: Konva.Node | null) => registerRef(el.id, node),
    onMouseDown: (e: KonvaEventObject<MouseEvent | TouchEvent>) => onPointerDown(e, el.id),
    onClick: (e: KonvaEventObject<MouseEvent | TouchEvent>) => onPointerDown(e, el.id),
    onContextMenu: (e: KonvaEventObject<PointerEvent>) => onContextMenu(e, el.id),
    onDragStart: (e: KonvaEventObject<DragEvent>) => onDragStart(e, el.id),
    onDragMove: (e: KonvaEventObject<DragEvent>) => onDragMove(e, el.id),
    onDragEnd: (e: KonvaEventObject<DragEvent>) => onDragEnd(e, el.id),
    onTransformEnd: (e: KonvaEventObject<Event>) => onTransformEnd(e, el.id),
    onDblClick: () => onDblClick(el.id),
    stroke: el.stroke && el.strokeWidth > 0 ? el.stroke : undefined,
    strokeWidth: el.stroke && el.strokeWidth > 0 ? el.strokeWidth : undefined,
  };

  const centerX = el.x + el.width / 2;
  const centerY = el.y + el.height / 2;

  switch (el.type as ElementType) {
    case "Rectangle":
    case "Frame":
      return (
        <Rect
          {...shared}
          x={centerX}
          y={centerY}
          width={el.width}
          height={el.height}
          cornerRadius={el.type === "Frame" ? 0 : el.cornerRadius}
          fill={el.fill ?? (el.type === "Frame" ? "#FFFFFF" : undefined)}
          stroke={el.type === "Frame" ? (el.stroke ?? "#E4E7EC") : shared.stroke}
          strokeWidth={el.type === "Frame" ? Math.max(el.strokeWidth, 1) : shared.strokeWidth}
          offsetX={el.width / 2}
          offsetY={el.height / 2}
          shadowColor={el.type === "Frame" ? "#101828" : undefined}
          shadowOpacity={el.type === "Frame" ? 0.12 : 0}
          shadowBlur={el.type === "Frame" ? 24 : 0}
          shadowOffsetY={el.type === "Frame" ? 8 : 0}
        />
      );
    case "Ellipse":
      return (
        <Ellipse
          {...shared}
          x={centerX}
          y={centerY}
          radiusX={el.width / 2}
          radiusY={el.height / 2}
          fill={el.fill ?? undefined}
        />
      );
    case "Line": {
      const points = parsePoints(el.points);
      return (
        <Line
          {...shared}
          x={el.x}
          y={el.y}
          points={points.length >= 4 ? points : [0, 0, el.width, el.height]}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          closed={false}
          stroke={el.stroke ?? el.fill ?? "#101828"}
          strokeWidth={Math.max(el.strokeWidth, 1)}
          fill={undefined}
        />
      );
    }
    case "Pencil": {
      const points = parsePoints(el.points);
      return (
        <Line
          {...shared}
          x={el.x}
          y={el.y}
          points={points}
          tension={0.35}
          lineCap="round"
          lineJoin="round"
          stroke={el.stroke ?? "#101828"}
          strokeWidth={Math.max(el.strokeWidth, 2)}
          fill={undefined}
        />
      );
    }
    case "Text":
      return (
        <Text
          {...shared}
          x={centerX}
          y={centerY}
          width={el.width}
          offsetX={el.width / 2}
          offsetY={el.height / 2}
          text={el.text ?? "Text"}
          fontSize={el.fontSize}
          fontFamily={resolveCanvasFontStack(el.fontFamily)}
          fontStyle={fontWeightMap[el.fontWeight] ?? "400"}
          align={el.textAlign.toLowerCase()}
          lineHeight={el.lineHeight}
          fill={el.fill ?? "#101828"}
          wrap="word"
          ellipsis={false}
        />
      );
    case "Image":
      return (
        <KImage
          {...shared}
          x={centerX}
          y={centerY}
          width={el.width}
          height={el.height}
          offsetX={el.width / 2}
          offsetY={el.height / 2}
          image={image}
        />
      );
    default:
      return null;
  }
});

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef(new Map<string, Konva.Node>());
  const imageCache = useRef(new Map<string, { src: string; image: HTMLImageElement }>());
  const failedImageSrcs = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [size, setSize] = useState({ width: 800, height: 600 });
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [space, setSpace] = useState(false);

  const elements = useEditor((s) => s.elements);
  const selection = useEditor((s) => s.selection);
  const tool = useEditor((s) => s.tool);
  const canEdit = useEditor((s) => s.canEdit);
  const zoom = useEditor((s) => s.zoom);
  const panX = useEditor((s) => s.panX);
  const panY = useEditor((s) => s.panY);
  const gridVisible = useEditor((s) => s.gridVisible);
  const designWidth = useEditor((s) => s.designWidth);
  const designHeight = useEditor((s) => s.designHeight);
  const designBackground = useEditor((s) => s.designBackground);
  const draft = useEditor((s) => s.draft);
  const marquee = useEditor((s) => s.marquee);
  const editingTextId = useEditor((s) => s.editingTextId);
  const cursors = useEditor((s) => s.cursors);
  const remoteSelections = useEditor((s) => s.remoteSelections);
  const selfUserId = useEditor((s) => s.selfUserId);
  const comments = useEditor((s) => s.comments);
  const pendingComment = useEditor((s) => s.pendingComment);
  const activeCommentId = useEditor((s) => s.activeCommentId);
  const setPendingComment = useEditor((s) => s.setPendingComment);
  const setActiveComment = useEditor((s) => s.setActiveComment);

  const store = useEditor.getState;

  useEffect(() => {
    bindEditorStage(stageRef.current);
    return () => bindEditorStage(null);
  }, []);

  const drawing = useRef<{ kind: "none" | "shape" | "pencil" | "pan" | "marquee"; startVec: Vec; startPan: Vec; basePositions: Map<string, Vec>; moved: boolean; additive: boolean }>({
    kind: "none",
    startVec: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    basePositions: new Map(),
    moved: false,
    additive: false,
  });

  /* ---------------- helpers ---------------- */

  const toDesign = useCallback(
    (point: Vec): Vec => ({ x: (point.x - panX) / zoom, y: (point.y - panY) / zoom }),
    [panX, panY, zoom],
  );

  const pointer = useCallback((): Vec | null => {
    const pos = stageRef.current?.getPointerPosition();
    return pos ? { x: pos.x, y: pos.y } : null;
  }, []);

  /* ---------------- sizing ---------------- */

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) });
    });
    observer.observe(container);
    setSize({ width: container.clientWidth, height: container.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ---------------- image loading ---------------- */

  const imageSrcKey = useMemo(
    () =>
      JSON.stringify(
        elements
          .filter((e) => e.type === "Image" && e.src)
          .map((e) => ({ id: e.id, src: e.src as string })),
      ),
    [elements],
  );

  useEffect(() => {
    if (!imageSrcKey) return;
    const entries = JSON.parse(imageSrcKey) as { id: string; src: string }[];
    let cancelled = false;

    const loadImage = ({ id, src }: { id: string; src: string }) => {
      if (!isSafeImageSrc(src)) return;
      if (failedImageSrcs.current.has(src)) return;
      const cached = imageCache.current.get(id);
      if (cached && cached.src === src) {
        if (!cancelled) {
          setImages((prev) => (prev[id] === cached.image ? prev : { ...prev, [id]: cached.image }));
        }
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // always cache, even for cancelled effects, so a rerun never refetches
        imageCache.current.set(id, { src, image: img });
        if (cancelled) return;
        setImages((prev) => ({ ...prev, [id]: img }));
      };
      img.onerror = () => {
        failedImageSrcs.current.add(src);
        imageCache.current.delete(id);
        if (cancelled) return;
        setImages((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      };
      img.src = src;
    };

    entries.forEach(loadImage);
    return () => {
      cancelled = true;
    };
  }, [imageSrcKey]);

  /* ---------------- transformer attach ---------------- */

  const selectedElements = useMemo(
    () => elements.filter((e) => selection.includes(e.id) && e.isVisible && !e.isLocked),
    [elements, selection],
  );

  useLayoutEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const nodes = selectedElements
      .map((e) => nodeRefs.current.get(e.id))
      .filter((n): n is Konva.Node => Boolean(n));
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedElements, elements]);

  /* ---------------- element events ---------------- */

  const handlePointerDown = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
      const state = store();
      event.cancelBubble = true;
      const evt = event.evt as MouseEvent;

      if (state.tool === "select") {
        if (evt.shiftKey) {
          state.toggleSelect(id);
        } else if (!state.selection.includes(id)) {
          state.select([id]);
        }
      }
    },
    [store],
  );

  const handleContextMenu = useCallback(
    (event: KonvaEventObject<PointerEvent>, id: string) => {
      event.evt.preventDefault();
      event.cancelBubble = true;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const state = store();
      if (!state.selection.includes(id)) state.select([id]);
      state.setContextMenu({ x: event.evt.clientX - rect.left, y: event.evt.clientY - rect.top, targetId: id });
    },
    [store],
  );

  const dragBases = useRef<{ id: string; pos: Vec }[]>([]);
  const historyPushed = useRef(false);

  const handleDragStart = useCallback(
    (_event: KonvaEventObject<DragEvent>, id: string) => {
      const state = store();
      if (!state.selection.includes(id)) state.select([id]);
      state.pushHistory();
      historyPushed.current = true;
      const ids = state.selection.includes(id) ? state.selection : [id];
      dragBases.current = state.elements
        .filter((e) => ids.includes(e.id))
        .map((e) => ({ id: e.id, pos: { x: e.x, y: e.y } }));
      drawing.current.moved = false;
    },
    [store],
  );

  const handleDragMove = useCallback(
    (event: KonvaEventObject<DragEvent>, id: string) => {
      const node = event.target;
      const state = store();
      drawing.current.moved = true;
      const el = state.elements.find((e) => e.id === id);
      if (!el) return;
      const delta = { x: node.x() - (el.x + el.width / 2), y: node.y() - (el.y + el.height / 2) };
      const positions = dragBases.current
        .filter((b) => b.id !== id)
        .map((b) => ({ id: b.id, x: b.pos.x + delta.x, y: b.pos.y + delta.y }));
      if (positions.length > 0) state.previewPositions(positions);
    },
    [store],
  );

  const handleDragEnd = useCallback(
    (event: KonvaEventObject<DragEvent>, id: string) => {
      const node = event.target;
      const state = store();
      const el = state.elements.find((e) => e.id === id);
      if (el) {
        const delta = { x: node.x() - (el.x + el.width / 2), y: node.y() - (el.y + el.height / 2) };
        const positions = [
          { id, x: node.x() - el.width / 2, y: node.y() - el.height / 2 },
          ...dragBases.current
            .filter((b) => b.id !== id)
            .map((b) => ({ id: b.id, x: b.pos.x + delta.x, y: b.pos.y + delta.y })),
        ];
        state.previewPositions(positions);
        state.commitMove(positions.map((p) => p.id));
      }
      dragBases.current = [];
      historyPushed.current = false;
    },
    [store],
  );

  const handleTransformEnd = useCallback(
    (event: KonvaEventObject<Event>, id: string) => {
      const node = event.target as Konva.Node & {
        scaleX: () => number;
        scaleY: () => number;
        rotation: () => number;
        width: () => number;
        height: () => number;
        x: () => number;
        y: () => number;
        radiusX?: () => number;
        radiusY?: () => number;
      };
      const state = store();
      const element = state.elements.find((e) => e.id === id);
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const isRound = element.type === "Ellipse";
      const width = isRound ? (node.radiusX?.() ?? 0) * 2 * scaleX : node.width() * scaleX;
      const height = isRound ? (node.radiusY?.() ?? 0) * 2 * scaleY : node.height() * scaleY;
      const nextWidth = Math.max(2, width);
      const nextHeight = Math.max(2, height);

      const centerX = node.x();
      const centerY = node.y();
      const nextX = centerX - nextWidth / 2;
      const nextY = centerY - nextHeight / 2;
      const rotation = node.rotation();

      state.pushHistory();
      const patch: Record<string, number | string> = {
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
        rotation,
      };
      if (element.type === "Text" && scaleY !== 1) {
        patch.fontSize = Math.max(6, Math.round(element.fontSize * scaleY));
      }
      state.updateElement(id, patch, { immediate: true });

      if (isRound) {
        node.x(centerX);
        node.y(centerY);
      } else {
        node.x(centerX);
        node.y(centerY);
      }
      transformerRef.current?.update();
      transformerRef.current?.getLayer()?.batchDraw();
    },
    [store],
  );

  const handleDblClick = useCallback(
    (id: string) => {
      const state = store();
      const element = state.elements.find((e) => e.id === id);
      if (!element || element.type !== "Text" || !state.canEdit) return;
      state.pushHistory();
      state.setEditingText(id);
    },
    [store],
  );

  const registerRef = useCallback((id: string, node: Konva.Node | null) => {
    if (node) nodeRefs.current.set(id, node);
    else nodeRefs.current.delete(id);
  }, []);

  /* ---------------- stage events ---------------- */

  const handleStageMouseDown = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const state = store();
      const evt = event.evt as MouseEvent;
      const pos = pointer();
      if (!pos) return;
      const design = toDesign(pos);
      const targetIsStage = event.target === event.target.getStage();
      const isPanning = space || evt.button === 1 || state.tool === "hand";

      if (isPanning) {
        drawing.current = {
          kind: "pan",
          startVec: pos,
          startPan: { x: state.panX, y: state.panY },
          basePositions: new Map(),
          moved: false,
          additive: false,
        };
        return;
      }

      if (state.contextMenu) state.setContextMenu(null);

      if (!targetIsStage) return;

      switch (state.tool) {
        case "select": {
          drawing.current.additive = Boolean(evt.shiftKey);
          if (!evt.shiftKey) state.clearSelection();
          state.setContextMenu(null);
          drawing.current = {
            kind: "marquee",
            startVec: design,
            startPan: { x: state.panX, y: state.panY },
            basePositions: new Map(),
            moved: false,
            additive: Boolean(evt.shiftKey),
          };
          state.setMarquee({ x1: design.x, y1: design.y, x2: design.x, y2: design.y });
          break;
        }
        case "rectangle":
        case "ellipse":
        case "frame": {
          drawing.current = {
            kind: "shape",
            startVec: design,
            startPan: { x: state.panX, y: state.panY },
            basePositions: new Map(),
            moved: false,
            additive: false,
          };
          state.setDraft({
            type: state.tool === "rectangle" ? "Rectangle" : state.tool === "ellipse" ? "Ellipse" : "Frame",
            startX: design.x,
            startY: design.y,
            x: design.x,
            y: design.y,
            width: 0,
            height: 0,
          });
          break;
        }
        case "line": {
          drawing.current = {
            kind: "shape",
            startVec: design,
            startPan: { x: state.panX, y: state.panY },
            basePositions: new Map(),
            moved: false,
            additive: false,
          };
          state.setDraft({
            type: "Line",
            startX: design.x,
            startY: design.y,
            x: design.x,
            y: design.y,
            width: 0,
            height: 0,
            points: [design.x, design.y, design.x, design.y],
          });
          break;
        }
        case "pencil": {
          drawing.current = {
            kind: "pencil",
            startVec: design,
            startPan: { x: state.panX, y: state.panY },
            basePositions: new Map(),
            moved: false,
            additive: false,
          };
          state.setDraft({
            type: "Pencil",
            startX: design.x,
            startY: design.y,
            x: design.x,
            y: design.y,
            width: 0,
            height: 0,
            points: [design.x, design.y],
          });
          break;
        }
        case "text": {
          void (async () => {
            const created = await state.addElement({
              type: "Text",
              name: "Text",
              x: design.x,
              y: design.y,
              width: 220,
              height: 36,
              text: "Text",
              fontSize: 24,
              fill: "#101828",
            });
            if (created) state.setEditingText(created.id);
          })();
          state.setTool("select");
          break;
        }
        case "comment": {
          setPendingComment({ x: design.x, y: design.y });
          break;
        }
        case "image": {
          drawing.current.startVec = design;
          fileInputRef.current?.click();
          break;
        }
        default:
          break;
      }
    },
    [pointer, setPendingComment, space, store, toDesign],
  );

  const handleStageMouseMove = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const state = store();
      const pos = pointer();
      if (!pos) return;
      const design = toDesign(pos);
      state.scheduleCursor(design.x, design.y);

      const current = drawing.current;
      if (current.kind === "none") return;
      const evt = event.evt as MouseEvent;

      if (current.kind === "pan") {
        state.setViewport({
          panX: current.startPan.x + (pos.x - current.startVec.x),
          panY: current.startPan.y + (pos.y - current.startVec.y),
        });
        return;
      }

      if (current.kind === "marquee") {
        current.moved = Math.abs(design.x - current.startVec.x) > 3 || Math.abs(design.y - current.startVec.y) > 3;
        if (current.moved) {
          state.setMarquee({ x1: current.startVec.x, y1: current.startVec.y, x2: design.x, y2: design.y });
        }
        return;
      }

      if (current.kind === "shape") {
        const d = state.draft;
        if (!d) return;
        current.moved = Math.abs(design.x - current.startVec.x) > 2 || Math.abs(design.y - current.startVec.y) > 2;
        if (d.type === "Line") {
          state.setDraft({ ...d, x: design.x, y: design.y, width: design.x - current.startVec.x, height: design.y - current.startVec.y, points: [current.startVec.x, current.startVec.y, design.x, design.y] });
        } else {
          state.setDraft({
            ...d,
            x: Math.min(current.startVec.x, design.x),
            y: Math.min(current.startVec.y, design.y),
            width: Math.abs(design.x - current.startVec.x),
            height: Math.abs(design.y - current.startVec.y),
          });
        }
        return;
      }

      if (current.kind === "pencil") {
        const d = state.draft;
        if (!d || !d.points) return;
        const points = d.points;
        const lastX = points[points.length - 2];
        const lastY = points[points.length - 1];
        if (Math.hypot(design.x - lastX, design.y - lastY) < 2.5) return;
        const next = [...points, design.x, design.y];
        const xs = next.filter((_, i) => i % 2 === 0);
        const ys = next.filter((_, i) => i % 2 === 1);
        current.moved = true;
        state.setDraft({
          ...d,
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
          points: next,
        });
        void evt;
      }
    },
    [pointer, store, toDesign],
  );

  const handleStageMouseUp = useCallback(() => {
    const state = store();
    const current = drawing.current;
    drawing.current = { ...drawing.current, kind: "none" };

    if (current.kind === "marquee") {
      // selection is not an edit operation — viewers can marquee-select too (M6)
      const rect = state.marquee;
      state.setMarquee(null);
      if (rect && current.moved) {
        const minX = Math.min(rect.x1, rect.x2);
        const maxX = Math.max(rect.x1, rect.x2);
        const minY = Math.min(rect.y1, rect.y2);
        const maxY = Math.max(rect.y1, rect.y2);
        const hits = state.elements
          .filter(
            (e) =>
              e.isVisible &&
              e.x < maxX &&
              e.x + e.width > minX &&
              e.y < maxY &&
              e.y + e.height > minY,
          )
          .map((e) => e.id);
        state.select(current.additive ? Array.from(new Set([...state.selection, ...hits])) : hits);
      } else {
        state.clearSelection();
      }
      return;
    }

    if (!state.canEdit) {
      state.setDraft(null);
      return;
    }

    if (current.kind === "shape") {
      const d = state.draft;
      state.setDraft(null);
      if (!d) return;
      if (d.type === "Line") {
        const points = d.points ?? [];
        const x1 = points[0] ?? current.startVec.x;
        const y1 = points[1] ?? current.startVec.y;
        const x2 = points[2] ?? x1;
        const y2 = points[3] ?? y1;
        const length = Math.hypot(x2 - x1, y2 - y1);
        void state.addElement({
          type: "Line",
          name: "Line",
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.max(Math.abs(x2 - x1), 1),
          height: Math.max(Math.abs(y2 - y1), 1),
          points: JSON.stringify([x1 - Math.min(x1, x2), y1 - Math.min(y1, y2), x2 - Math.min(x1, x2), y2 - Math.min(y1, y2)]),
          stroke: "#101828",
          strokeWidth: 2,
          fill: null,
        });
        if (length < 1) state.setTool("select");
        return;
      }

      let { x, y, width, height } = d;
      if (!current.moved || width < 3 || height < 3) {
        const defaults = d.type === "Ellipse" ? { w: 140, h: 140 } : d.type === "Frame" ? { w: 800, h: 600 } : { w: 180, h: 120 };
        x = current.startVec.x - defaults.w / 2;
        y = current.startVec.y - defaults.h / 2;
        width = defaults.w;
        height = defaults.h;
      }
      void state.addElement({
        type: d.type,
        name: d.type === "Frame" ? "Frame" : d.type === "Ellipse" ? "Ellipse" : "Rectangle",
        x,
        y,
        width,
        height,
        fill: d.type === "Frame" ? "#FFFFFF" : undefined,
        stroke: d.type === "Frame" ? "#E4E7EC" : undefined,
        strokeWidth: d.type === "Frame" ? 1 : undefined,
        cornerRadius: d.type === "Rectangle" ? 4 : 0,
      });
      if (!current.moved) state.setTool("select");
      return;
    }

    if (current.kind === "pencil") {
      const d = state.draft;
      state.setDraft(null);
      if (!d || !d.points || d.points.length < 4) return;
      const points = d.points;
      const xs = points.filter((_, i) => i % 2 === 0);
      const ys = points.filter((_, i) => i % 2 === 1);
      const originX = Math.min(...xs);
      const originY = Math.min(...ys);
      const relative = points.map((v, i) => (i % 2 === 0 ? v - originX : v - originY));
      void state.addElement({
        type: "Pencil",
        name: "Pencil",
        x: originX,
        y: originY,
        width: Math.max(Math.max(...xs) - originX, 1),
        height: Math.max(Math.max(...ys) - originY, 1),
        points: JSON.stringify(relative),
        stroke: "#101828",
        strokeWidth: 3,
        fill: null,
      });
    }
  }, [store]);

  const handleStageContextMenu = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      event.evt.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const state = store();
      const targetId = typeof event.target.id() === "string" && event.target.id() ? event.target.id() : null;
      state.setContextMenu({
        x: event.evt.clientX - rect.left,
        y: event.evt.clientY - rect.top,
        targetId,
      });
    },
    [store],
  );

  const handleWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault();
      const state = store();
      const evt = event.evt;
      const stage = stageRef.current;
      if (!stage) return;

      if (evt.ctrlKey || evt.metaKey) {
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        const oldZoom = state.zoom;
        const factor = Math.exp(-evt.deltaY * 0.0022);
        const newZoom = clamp(oldZoom * factor, 0.05, 8);
        const ratio = newZoom / oldZoom;
        const nextPanX = pointerPos.x - (pointerPos.x - state.panX) * ratio;
        const nextPanY = pointerPos.y - (pointerPos.y - state.panY) * ratio;
        state.setViewport({ zoom: newZoom, panX: nextPanX, panY: nextPanY });
      } else {
        state.setViewport({
          panX: state.panX - evt.deltaX,
          panY: state.panY - evt.deltaY,
        });
      }
    },
    [store],
  );

  /* ---------------- file drop for image tool ---------------- */

  const onFilePicked = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const state = store();
      const clickPoint = drawing.current.startVec;

      if (!file.type.startsWith("image/")) {
        toast.error("Pick an image file (PNG, JPEG, WEBP or GIF).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Images must be 5 MB or smaller.");
        return;
      }

      let src: string;
      try {
        const form = new FormData();
        form.append("file", file, file.name || "image");
        const uploaded = await apiFetch<{ url: string }>("/uploads/images", {
          method: "POST",
          formData: form,
        });
        src = uploaded.url;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not upload the image");
        return;
      }

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Invalid image"));
        image.src = src;
      });
      const max = 640;
      const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * ratio);
      const height = Math.round(img.naturalHeight * ratio);
      await state.addElement({
        type: "Image",
        name: file.name.replace(/\.[^.]+$/, "") || "Image",
        x: clickPoint.x - width / 2,
        y: clickPoint.y - height / 2,
        width,
        height,
        src,
      });
      state.setTool("select");
    },
    [store],
  );

  /* ---------------- stale cursor cleanup ---------------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      const state = store();
      const cutoff = Date.now() - 9000;
      const stale = Object.entries(state.cursors).filter(([, c]) => c.updatedAt < cutoff);
      if (stale.length > 0) {
        const next = { ...state.cursors };
        for (const [key] of stale) delete next[key];
        useEditor.setState({ cursors: next });
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [store]);

  /* ---------------- rendering ---------------- */

  const cursorClass =
    tool === "hand" || space
      ? "cursor-grab active:cursor-grabbing"
      : tool === "select"
        ? "cursor-default"
        : tool === "comment"
          ? "cursor-crosshair"
          : "cursor-crosshair";

  const stageCursor =
    tool === "hand" || space ? "grab" : tool === "select" ? "default" : "crosshair";

  const editingElement = editingTextId ? elements.find((e) => e.id === editingTextId) : null;

  const commentPins = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);
    return roots;
  }, [comments]);

  return (
    <div
      ref={containerRef}
      id="editor-canvas"
      className={cn("relative flex-1 overflow-hidden bg-canvas", cursorClass)}
      style={{
        backgroundImage: gridVisible
          ? "radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)"
          : undefined,
        backgroundSize: gridVisible ? `${20 * zoom}px ${20 * zoom}px` : undefined,
        backgroundPosition: gridVisible ? `${panX}px ${panY}px` : undefined,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={panX}
        y={panY}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        onContextMenu={handleStageContextMenu}
        onWheel={handleWheel}
        style={{ cursor: stageCursor }}
      >
        <Layer>
        <Rect
          x={0}
          y={0}
          width={designWidth}
          height={designHeight}
          fill={designBackground}
          name="design-background"
          listening={false}
          shadowColor="#101828"
          shadowOpacity={0.18}
          shadowBlur={40}
          shadowOffsetY={10}
        />

        {elements.map((element) => (
          <ShapeNode
            key={element.id}
            element={element}
            image={images[element.id]}
            tool={tool}
            canEdit={canEdit}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            onDblClick={handleDblClick}
            registerRef={registerRef}
          />
        ))}

        {Object.entries(remoteSelections).map(([userId, entry]) =>
          entry.ids.map((id) => {
            const element = elements.find((e) => e.id === id);
            if (!element || !element.isVisible) return null;
            return (
              <Rect
                key={`${userId}-${id}`}
                x={element.x - 2 / zoom}
                y={element.y - 2 / zoom}
                width={element.width + 4 / zoom}
                height={element.height + 4 / zoom}
                stroke={entry.color}
                strokeWidth={1.5 / zoom}
                dash={[6 / zoom, 4 / zoom]}
                listening={false}
              />
            );
          }),
        )}

        {draft ? (
          draft.type === "Line" && draft.points ? (
            <Line
              x={draft.points[0]}
              y={draft.points[1]}
              points={[0, 0, draft.points[2] - draft.points[0], draft.points[3] - draft.points[1]]}
              stroke="#3B5BFE"
              strokeWidth={2}
              listening={false}
            />
          ) : draft.type === "Pencil" && draft.points ? (
            <Line
              points={draft.points}
              tension={0.35}
              stroke="#3B5BFE"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          ) : (
            <Rect
              x={draft.x}
              y={draft.y}
              width={draft.width}
              height={draft.height}
              cornerRadius={draft.type === "Rectangle" ? 4 : 0}
              fill={draft.type === "Ellipse" ? "rgba(59,91,254,0.12)" : "rgba(59,91,254,0.10)"}
              stroke="#3B5BFE"
              strokeWidth={1 / zoom}
              dash={[6 / zoom, 4 / zoom]}
              listening={false}
            />
          )
        ) : null}

        {marquee ? (
          <Rect
            x={Math.min(marquee.x1, marquee.x2)}
            y={Math.min(marquee.y1, marquee.y2)}
            width={Math.abs(marquee.x2 - marquee.x1)}
            height={Math.abs(marquee.y2 - marquee.y1)}
            fill="rgba(59,91,254,0.10)"
            stroke="#3B5BFE"
            strokeWidth={1 / zoom}
            listening={false}
          />
        ) : null}

        <Transformer
          ref={transformerRef}
          rotateEnabled={canEdit}
          enabledAnchors={
            selectedElements.length === 1 && selectedElements[0]?.type === "Pencil"
              ? []
              : ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]
          }
          keepRatio={false}
          borderStroke="#3B5BFE"
          borderStrokeWidth={1.25 / zoom}
          anchorStroke="#3B5BFE"
          anchorFill="#FFFFFF"
          anchorSize={9 / zoom}
          anchorCornerRadius={2}
          rotateAnchorOffset={26 / zoom}
          padding={4 / zoom}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 4 || newBox.height < 4) return oldBox;
            return newBox;
          }}
        />
        </Layer>
      </Stage>

      {/* remote cursors */}
      {Object.entries(cursors)
        .filter(([userId]) => userId !== selfUserId)
        .map(([userId, cursor]) => {
          const screenX = cursor.x * zoom + panX;
          const screenY = cursor.y * zoom + panY;
          if (screenX < -60 || screenY < -60 || screenX > size.width + 60 || screenY > size.height + 60) {
            return null;
          }
          return (
            <div
              key={userId}
              className="pointer-events-none absolute z-20"
              style={{ left: screenX, top: screenY }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 2l14 6.6-6.2 1.7L8.6 17 3 2z"
                  fill={cursor.color}
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="-ml-1 mt-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(16,24,40,0.25)]"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.displayName.split(" ")[0]}
              </span>
            </div>
          );
        })}

      {/* remote selection labels */}
      {Object.entries(remoteSelections).map(([userId, entry]) => {
        const first = elements.find((e) => entry.ids.includes(e.id));
        if (!first) return null;
        const screenX = first.x * zoom + panX;
        const screenY = first.y * zoom + panY - 24;
        if (screenY < -30) return null;
        return (
          <span
            key={`label-${userId}`}
            className="pointer-events-none absolute z-20 rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ left: screenX, top: screenY, backgroundColor: entry.color }}
          >
            {entry.displayName.split(" ")[0]}
          </span>
        );
      })}

      {/* comment pins */}
      {commentPins.map((comment, index) => {
        const screenX = comment.x * zoom + panX;
        const screenY = comment.y * zoom + panY;
        const active = activeCommentId === comment.id;
        return (
          <button
            key={comment.id}
            type="button"
            onClick={() => setActiveComment(comment.id)}
            className={cn(
              "absolute z-30 flex size-7 items-center justify-center rounded-full rounded-bl-none border-2 border-white text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(16,24,40,0.3)] transition-transform hover:scale-110",
              active && "scale-110 ring-2 ring-brand-400",
              comment.resolved && "opacity-55",
            )}
            style={{ left: screenX - 6, top: screenY - 28, backgroundColor: comment.author.color }}
            title={`${comment.author.displayName}: ${comment.body}`}
          >
            {index + 1}
          </button>
        );
      })}

      {pendingComment ? (
        <div
          className="pointer-events-none absolute z-30 flex size-7 items-center justify-center rounded-full rounded-bl-none border-2 border-dashed border-white bg-brand-600 text-white shadow-lg"
          style={{
            left: pendingComment.x * zoom + panX - 6,
            top: pendingComment.y * zoom + panY - 28,
          }}
        >
          +
        </div>
      ) : null}

      {/* text editing overlay */}
      {editingElement ? (
        <TextEditorOverlay
          element={editingElement}
          zoom={zoom}
          panX={panX}
          panY={panY}
          containerWidth={size.width}
          containerHeight={size.height}
        />
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          void onFilePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <ContextMenu />
    </div>
  );
}

function TextEditorOverlay({
  element,
  zoom,
  panX,
  panY,
  containerWidth,
  containerHeight,
}: {
  element: DesignElementDto;
  zoom: number;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const updateElement = useEditor((s) => s.updateElement);
  const setEditingText = useEditor((s) => s.setEditingText);
  const [value, setValue] = useState(element.text ?? "");

  const left = element.x * zoom + panX;
  const top = element.y * zoom + panY;
  const width = Math.max(element.width * zoom, 60);
  const height = Math.max(element.height * zoom, 24);

  if (left > containerWidth || top > containerHeight || left + width < 0 || top + height < 0) {
    return null;
  }

  const weight =
    element.fontWeight === "Bold" || element.fontWeight === "Extrabold"
      ? "700"
      : element.fontWeight === "Semibold" || element.fontWeight === "Medium"
        ? "600"
        : "400";

  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        updateElement(element.id, { text: e.target.value });
      }}
      onBlur={() => setEditingText(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          setEditingText(null);
        }
        e.stopPropagation();
      }}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        fontSize: element.fontSize * zoom,
        fontFamily: resolveCanvasFontStack(element.fontFamily),
        fontWeight: weight,
        lineHeight: element.lineHeight,
        textAlign: element.textAlign.toLowerCase() as "left" | "center" | "right",
        color: element.fill ?? "#101828",
        background: "rgba(255,255,255,0.65)",
        border: `1.5px solid #3B5BFE`,
        outline: "none",
        resize: "none",
        padding: 0,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: 40,
      }}
      className="absolute"
      aria-label="Edit text"
    />
  );
}
