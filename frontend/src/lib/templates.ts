import type { DesignElementDto, ElementType, FontWeightValue, TextAlignValue } from "./types";
import { uid } from "./utils";

export interface TemplateElementInput {
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeightValue;
  textAlign?: TextAlignValue;
  opacity?: number;
  lineHeight?: number;
}

export interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  elements: TemplateElementInput[];
}

export const templates: RoomTemplate[] = [
  {
    id: "blank",
    name: "Blank Room",
    description: "An empty canvas ready for whatever you want to make.",
    accentColor: "#3B5BFE",
    elements: [],
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Hero, headline, call to action and decorative shapes.",
    accentColor: "#F5741F",
    elements: [
      { type: "Rectangle", name: "Nav bar", x: 80, y: 48, width: 1280, height: 56, fill: "#FFFFFF", cornerRadius: 10, stroke: "#E4E7EC", strokeWidth: 1 },
      { type: "Text", name: "Logo", x: 104, y: 64, width: 160, height: 28, text: "Fiagmazation", fontSize: 20, fontWeight: "Bold", fill: "#101828" },
      { type: "Rectangle", name: "Nav CTA", x: 1230, y: 60, width: 110, height: 36, fill: "#3B5BFE", cornerRadius: 8 },
      { type: "Text", name: "Nav CTA label", x: 1252, y: 69, width: 90, height: 20, text: "Get Started", fontSize: 14, fontWeight: "Semibold", fill: "#FFFFFF", textAlign: "Center" },
      { type: "Text", name: "Headline", x: 140, y: 240, width: 720, height: 120, text: "Design Together,\nCreate More.", fontSize: 64, fontWeight: "Bold", fill: "#101828", lineHeight: 1.1 },
      { type: "Text", name: "Subheading", x: 140, y: 390, width: 560, height: 72, text: "Fiagmazation is a modern collaborative design tool that brings your ideas to life.", fontSize: 20, fill: "#667085", lineHeight: 1.5 },
      { type: "Rectangle", name: "Primary button", x: 140, y: 500, width: 190, height: 56, fill: "#3B5BFE", cornerRadius: 10 },
      { type: "Text", name: "Primary label", x: 165, y: 517, width: 140, height: 24, text: "Get Started Free", fontSize: 16, fontWeight: "Semibold", fill: "#FFFFFF", textAlign: "Center" },
      { type: "Ellipse", name: "Accent circle", x: 980, y: 210, width: 300, height: 300, fill: "#3B5BFE" },
      { type: "Rectangle", name: "Accent square", x: 860, y: 420, width: 170, height: 170, fill: "#F5741F", rotation: 14, cornerRadius: 24 },
      { type: "Ellipse", name: "Accent dot", x: 1180, y: 480, width: 110, height: 110, fill: "#7C5CFC" },
    ],
  },
  {
    id: "mobile",
    name: "Mobile App Screen",
    description: "A phone frame with header, content blocks and a tab bar.",
    accentColor: "#7C5CFC",
    elements: [
      { type: "Rectangle", name: "Phone", x: 480, y: 60, width: 390, height: 800, fill: "#FFFFFF", cornerRadius: 40, stroke: "#101828", strokeWidth: 3 },
      { type: "Rectangle", name: "Status bar", x: 500, y: 80, width: 350, height: 40, fill: "#F8F9FB", cornerRadius: 20 },
      { type: "Text", name: "Screen title", x: 512, y: 150, width: 320, height: 44, text: "Today", fontSize: 34, fontWeight: "Bold", fill: "#101828" },
      { type: "Rectangle", name: "Card 1", x: 512, y: 220, width: 326, height: 140, fill: "#3B5BFE", cornerRadius: 20 },
      { type: "Rectangle", name: "Card 2", x: 512, y: 380, width: 326, height: 140, fill: "#F5741F", cornerRadius: 20 },
      { type: "Rectangle", name: "Card 3", x: 512, y: 540, width: 155, height: 120, fill: "#7C5CFC", cornerRadius: 20 },
      { type: "Rectangle", name: "Card 4", x: 683, y: 540, width: 155, height: 120, fill: "#12B76A", cornerRadius: 20 },
      { type: "Rectangle", name: "Tab bar", x: 500, y: 770, width: 350, height: 66, fill: "#101828", cornerRadius: 24 },
      { type: "Ellipse", name: "Tab active", x: 540, y: 792, width: 22, height: 22, fill: "#FFFFFF" },
      { type: "Ellipse", name: "Tab", x: 655, y: 792, width: 22, height: 22, fill: "#667085" },
      { type: "Ellipse", name: "Tab", x: 770, y: 792, width: 22, height: 22, fill: "#667085" },
    ],
  },
  {
    id: "board",
    name: "Brand Board",
    description: "Palette swatches, logo marks and type samples.",
    accentColor: "#EC4899",
    elements: [
      { type: "Text", name: "Board title", x: 80, y: 70, width: 500, height: 60, text: "Brand Board", fontSize: 46, fontWeight: "Bold", fill: "#101828" },
      { type: "Text", name: "Palette label", x: 80, y: 170, width: 300, height: 28, text: "Palette", fontSize: 20, fontWeight: "Semibold", fill: "#667085" },
      { type: "Rectangle", name: "Swatch blue", x: 80, y: 220, width: 180, height: 180, fill: "#3B5BFE", cornerRadius: 16 },
      { type: "Rectangle", name: "Swatch orange", x: 280, y: 220, width: 180, height: 180, fill: "#F5741F", cornerRadius: 16 },
      { type: "Rectangle", name: "Swatch purple", x: 480, y: 220, width: 180, height: 180, fill: "#7C5CFC", cornerRadius: 16 },
      { type: "Rectangle", name: "Swatch red", x: 680, y: 220, width: 180, height: 180, fill: "#EF4444", cornerRadius: 16 },
      { type: "Rectangle", name: "Swatch ink", x: 880, y: 220, width: 180, height: 180, fill: "#101828", cornerRadius: 16 },
      { type: "Text", name: "Type label", x: 80, y: 450, width: 300, height: 28, text: "Typography", fontSize: 20, fontWeight: "Semibold", fill: "#667085" },
      { type: "Text", name: "Display", x: 80, y: 500, width: 700, height: 80, text: "Display — Jakarta ExtraBold", fontFamily: "Plus Jakarta Sans", fontSize: 52, fontWeight: "Bold", fill: "#101828" },
      { type: "Text", name: "Body", x: 80, y: 600, width: 700, height: 60, text: "Body copy is set in Inter at 18px with generous line height for readability.", fontSize: 18, fill: "#667085", lineHeight: 1.6 },
      { type: "Ellipse", name: "Logo mark", x: 940, y: 500, width: 120, height: 120, fill: "#F5741F" },
      { type: "Rectangle", name: "Logo stem", x: 975, y: 530, width: 26, height: 90, fill: "#3B5BFE", cornerRadius: 6 },
    ],
  },
];

export function templateToElements(template: RoomTemplate): Omit<DesignElementDto, "id" | "updatedAt">[] {
  return template.elements.map((el, index) => ({
    type: el.type,
    name: el.name,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation ?? 0,
    opacity: el.opacity ?? 1,
    fill: el.fill ?? null,
    stroke: el.stroke ?? null,
    strokeWidth: el.strokeWidth ?? 0,
    cornerRadius: el.cornerRadius ?? 0,
    text: el.text ?? null,
    fontFamily: el.fontFamily ?? "Inter",
    fontSize: el.fontSize ?? 24,
    fontWeight: el.fontWeight ?? "Regular",
    textAlign: el.textAlign ?? "Left",
    lineHeight: el.lineHeight ?? 1.4,
    src: null,
    points: null,
    zIndex: index,
    isVisible: true,
    isLocked: false,
    parentId: null,
    linkToDesignId: null,
  }));
}

export function newElementId(): string {
  return uid();
}
