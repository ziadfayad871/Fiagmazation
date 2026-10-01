"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { templates, templateToElements, type RoomTemplate } from "@/lib/templates";
import { toast } from "@/store/toast";
import type { DesignDto, RoomSummary } from "@/lib/types";

const PREVIEW_W = 340;
const PREVIEW_H = 176;

function TemplatePreview({ template }: { template: RoomTemplate }) {
  if (template.elements.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 border-b border-line-soft bg-surface text-ink-400"
        style={{ width: PREVIEW_W, height: PREVIEW_H }}
      >
        <Sparkles className="size-6" />
        <span className="text-[12px] font-semibold">Empty canvas</span>
      </div>
    );
  }

  const maxX = Math.max(...template.elements.map((e) => e.x + e.width));
  const maxY = Math.max(...template.elements.map((e) => e.y + e.height));
  const minX = Math.min(...template.elements.map((e) => e.x));
  const minY = Math.min(...template.elements.map((e) => e.y));
  const contentW = Math.max(maxX - minX, 1);
  const contentH = Math.max(maxY - minY, 1);
  const scale = Math.min((PREVIEW_W - 24) / contentW, (PREVIEW_H - 24) / contentH, 1);
  const offsetX = (PREVIEW_W - contentW * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_H - contentH * scale) / 2 - minY * scale;

  return (
    <div
      className="relative overflow-hidden border-b border-line-soft bg-card"
      style={{ width: PREVIEW_W, height: PREVIEW_H }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: "top left" }}
      >
        {template.elements.map((el, index) => {
          if (el.type === "Ellipse") {
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  borderRadius: "50%",
                  background: el.fill ?? "#3B5BFE",
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                }}
              />
            );
          }
          if (el.type === "Text") {
            return (
              <div
                key={index}
                className="absolute whitespace-pre"
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  fontSize: Math.max(el.fontSize ?? 16, 4),
                  fontWeight: 600,
                  lineHeight: el.lineHeight ?? 1.4,
                  textAlign: (el.textAlign ?? "Left").toLowerCase() as "left" | "center" | "right",
                  color: el.fill ?? "#101828",
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  overflow: "hidden",
                }}
              >
                {el.text}
              </div>
            );
          }
          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                background: el.fill ?? "#E4E7EC",
                border: el.stroke ? `${Math.max(el.strokeWidth ?? 1, 1)}px solid ${el.stroke}` : undefined,
                borderRadius: el.cornerRadius ?? 0,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createFromTemplate(template: RoomTemplate) {
    if (busyId) return;
    setBusyId(template.id);
    try {
      const room = await api.post<RoomSummary>("/rooms", {
        name: template.id === "blank" ? "Untitled Room" : `${template.name} Room`,
        description: template.description,
        accentColor: template.accentColor,
      });
      if (template.elements.length > 0) {
        const design = await api.post<DesignDto>(`/rooms/${room.id}/designs`, { name: "Design 1" });
        await api.put(`/designs/${design.id}`, { elements: templateToElements(template) });
      }
      toast.success(`“${template.name}” is ready`);
      router.push(`/editor?room=${room.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create a room from this template");
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">
          Templates
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Start from a ready-made layout and jump straight into the editor.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-pop"
          >
            <TemplatePreview template={template} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: template.accentColor }} />
                <h2 className="font-display text-[15px] font-extrabold text-ink-900">{template.name}</h2>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-ink-500">
                  <Layers className="size-3" />
                  {template.elements.length || "—"}
                </span>
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-500">{template.description}</p>
              <Button
                size="sm"
                className="mt-4"
                block
                loading={busyId === template.id}
                disabled={busyId !== null && busyId !== template.id}
                onClick={() => void createFromTemplate(template)}
              >
                {template.id === "blank" ? "Create blank room" : "Use template"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
