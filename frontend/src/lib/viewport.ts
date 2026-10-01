import { clamp } from "./utils";
import { useEditor } from "@/store/editor";

function canvasRect(): DOMRect | null {
  const el = document.getElementById("editor-canvas");
  return el ? el.getBoundingClientRect() : null;
}

export function fitToScreen(): void {
  const rect = canvasRect();
  const state = useEditor.getState();
  if (!rect) return;
  const padding = 72;
  const zoom = clamp(
    Math.min((rect.width - padding * 2) / state.designWidth, (rect.height - padding * 2) / state.designHeight),
    0.05,
    4,
  );
  const panX = (rect.width - state.designWidth * zoom) / 2;
  const panY = (rect.height - state.designHeight * zoom) / 2;
  state.setViewport({ zoom, panX, panY });
}

export function zoomTo(nextZoom: number): void {
  const rect = canvasRect();
  const state = useEditor.getState();
  const cx = rect ? rect.width / 2 : 400;
  const cy = rect ? rect.height / 2 : 300;
  const zoom = clamp(nextZoom, 0.05, 8);
  const ratio = zoom / state.zoom;
  state.setViewport({
    zoom,
    panX: cx - (cx - state.panX) * ratio,
    panY: cy - (cy - state.panY) * ratio,
  });
}

export function zoomBy(factor: number): void {
  zoomTo(useEditor.getState().zoom * factor);
}
