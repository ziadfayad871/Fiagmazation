import type Konva from "konva";

let stage: Konva.Stage | null = null;

export function bindEditorStage(next: Konva.Stage | null): void {
  stage = next;
}

export function getEditorStage(): Konva.Stage | null {
  return stage;
}
