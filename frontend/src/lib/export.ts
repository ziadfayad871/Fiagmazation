import type Konva from "konva";
import { getEditorStage } from "@/lib/stageRef";
import { round } from "@/lib/utils";
import type { DesignElementDto, FontWeightValue } from "@/lib/types";

const BACKGROUND_LAYER_NAME = "design-background";

const WEIGHT_NUMBERS: Record<FontWeightValue, string> = {
  Light: "300",
  Regular: "400",
  Medium: "500",
  Semibold: "600",
  Bold: "700",
  Extrabold: "800",
};

export function safeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "design";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

function rotationAttr(el: DesignElementDto): string {
  if (!el.rotation) return "";
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  return ` transform="rotate(${round(el.rotation, 3)} ${round(cx, 3)} ${round(cy, 3)})"`;
}

function groupOpen(el: DesignElementDto): string {
  const opacity = el.opacity !== 1 ? ` opacity="${round(el.opacity, 3)}"` : "";
  const rotation = rotationAttr(el);
  return opacity || rotation ? `<g${opacity}${rotation}>` : "";
}

function groupClose(opened: boolean): string {
  return opened ? "</g>" : "";
}

function fillStroke(el: DesignElementDto): { fill: string; stroke: string } {
  const fill = el.fill ? ` fill="${escapeXml(el.fill)}"` : ` fill="none"`;
  const stroke =
    el.stroke && el.strokeWidth > 0
      ? ` stroke="${escapeXml(el.stroke)}" stroke-width="${round(el.strokeWidth, 3)}"`
      : "";
  return { fill, stroke };
}

function elementToSvg(el: DesignElementDto): string {
  const opened = groupOpen(el);
  let body = "";

  switch (el.type) {
    case "Rectangle":
    case "Frame": {
      const { fill, stroke } = fillStroke(el);
      const radius = el.type === "Frame" ? 0 : round(el.cornerRadius, 3);
      body = `<rect x="${round(el.x, 3)}" y="${round(el.y, 3)}" width="${round(el.width, 3)}" height="${round(el.height, 3)}" rx="${radius}"${fill}${stroke} />`;
      break;
    }
    case "Ellipse": {
      const { fill, stroke } = fillStroke(el);
      body = `<ellipse cx="${round(el.x + el.width / 2, 3)}" cy="${round(el.y + el.height / 2, 3)}" rx="${round(el.width / 2, 3)}" ry="${round(el.height / 2, 3)}"${fill}${stroke} />`;
      break;
    }
    case "Line": {
      const points = parsePoints(el.points);
      const raw = points.length >= 4 ? points : [0, 0, el.width, el.height];
      const coords = raw.map((value, index) =>
        round(index % 2 === 0 ? value + el.x : value + el.y, 3),
      );
      const strokeColor = el.stroke ?? el.fill ?? "#101828";
      body = `<polyline points="${coords.join(" ")}" fill="none" stroke="${escapeXml(strokeColor)}" stroke-width="${round(Math.max(el.strokeWidth, 1), 3)}" stroke-linecap="round" stroke-linejoin="round" />`;
      break;
    }
    case "Pencil": {
      const points = parsePoints(el.points);
      const coords = points.map((value, index) =>
        round(index % 2 === 0 ? value + el.x : value + el.y, 3),
      );
      const strokeColor = el.stroke ?? "#101828";
      body = `<polyline points="${coords.join(" ")}" fill="none" stroke="${escapeXml(strokeColor)}" stroke-width="${round(Math.max(el.strokeWidth, 2), 3)}" stroke-linecap="round" stroke-linejoin="round" />`;
      break;
    }
    case "Text": {
      const lines = (el.text ?? "Text").split("\n");
      const anchor = el.textAlign === "Center" ? "middle" : el.textAlign === "Right" ? "end" : "start";
      const x = el.textAlign === "Center" ? el.x + el.width / 2 : el.textAlign === "Right" ? el.x + el.width : el.x;
      const lineHeightPx = el.fontSize * el.lineHeight;
      const tspans = lines
        .map(
          (line, index) =>
            `<tspan x="${round(x, 3)}" y="${round(el.y + lineHeightPx * index + el.fontSize, 3)}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      const color = el.fill ?? "#101828";
      body = `<text font-family="${escapeXml(el.fontFamily)}" font-size="${round(el.fontSize, 3)}" font-weight="${WEIGHT_NUMBERS[el.fontWeight] ?? "400"}" text-anchor="${anchor}" fill="${escapeXml(color)}">${tspans}</text>`;
      break;
    }
    case "Image": {
      const href = escapeXml(el.src ?? "");
      body = `<image href="${href}" x="${round(el.x, 3)}" y="${round(el.y, 3)}" width="${round(el.width, 3)}" height="${round(el.height, 3)}" preserveAspectRatio="none" />`;
      break;
    }
    default:
      body = "";
  }

  if (!body) return "";
  return opened ? `${opened}${body}${groupClose(true)}` : body;
}

export function buildDesignSvg(input: {
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: DesignElementDto[];
}): string {
  const body = input.elements
    .filter((el) => el.isVisible)
    .map(elementToSvg)
    .filter(Boolean)
    .join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">`,
    `<title>${escapeXml(input.name)}</title>`,
    `<rect x="0" y="0" width="${input.width}" height="${input.height}" fill="${escapeXml(input.backgroundColor)}" />`,
    body,
    `</svg>`,
  ].join("");
}

export function buildElementCss(el: DesignElementDto): string {
  const lines: string[] = [
    "position: absolute;",
    `left: ${round(el.x)}px;`,
    `top: ${round(el.y)}px;`,
    `width: ${round(el.width)}px;`,
    `height: ${round(el.height)}px;`,
  ];
  if (el.type === "Text") {
    lines.push(`color: ${el.fill ?? "#101828"};`);
    lines.push(`font-family: "${el.fontFamily}", sans-serif;`);
    lines.push(`font-size: ${round(el.fontSize)}px;`);
    lines.push(`font-weight: ${WEIGHT_NUMBERS[el.fontWeight] ?? "400"};`);
    lines.push(`line-height: ${el.lineHeight};`);
    lines.push(`text-align: ${el.textAlign.toLowerCase()};`);
  } else if (el.fill) {
    lines.push(`background: ${el.fill};`);
  }
  if (el.stroke && el.strokeWidth > 0) {
    lines.push(`border: ${round(el.strokeWidth)}px solid ${el.stroke};`);
    lines.push(`border-radius: ${round(el.cornerRadius)}px;`);
  } else if (el.cornerRadius > 0 && el.type !== "Frame") {
    lines.push(`border-radius: ${round(el.cornerRadius)}px;`);
  }
  if (el.opacity !== 1) lines.push(`opacity: ${round(el.opacity, 3)};`);
  if (el.rotation) lines.push(`transform: rotate(${round(el.rotation, 3)}deg);`);
  if (el.type === "Text" && el.textAlign !== "Left") {
    lines.push(`text-align: ${el.textAlign.toLowerCase()};`);
  }
  return lines.join("\n");
}

export async function exportDesignPng(input: {
  name: string;
  width: number;
  height: number;
  panX: number;
  panY: number;
}): Promise<void> {
  const stage: Konva.Stage | null = getEditorStage();
  if (!stage) throw new Error("The canvas is not ready yet");

  const hidden: Konva.Node[] = [];
  for (const layer of stage.getChildren()) {
    for (const child of layer.getChildren()) {
      if (child.isVisible() && !child.id() && child.name() !== BACKGROUND_LAYER_NAME) {
        hidden.push(child);
        child.hide();
      }
    }
  }

  let dataUrl: string;
  try {
    stage.batchDraw();
    dataUrl = stage.toDataURL({
      x: input.panX,
      y: input.panY,
      width: input.width,
      height: input.height,
      pixelRatio: 2,
      mimeType: "image/png",
    });
  } finally {
    for (const node of hidden) node.show();
    stage.batchDraw();
  }

  const blob = await (await fetch(dataUrl)).blob();
  downloadBlob(blob, `${safeFilename(input.name)}.png`);
}
