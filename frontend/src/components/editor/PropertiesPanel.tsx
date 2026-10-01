"use client";

import { useRef, useState, useEffect } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Copy,
  MousePointer,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useEditor } from "@/store/editor";
import { cn, round } from "@/lib/utils";
import type { DesignElementDto, FontWeightValue, RoomDetail, TextAlignValue, UpdateElementPayload } from "@/lib/types";

const FONTS = [
  "Inter",
  "Plus Jakarta Sans",
  "Roboto",
  "Montserrat",
  "Lato",
  "Playfair Display",
  "Space Grotesk",
  "Merriweather",
  "Caveat",
  "Georgia",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Verdana",
];

const requestedRoomDesigns = new Set<string>();
const WEIGHTS: FontWeightValue[] = ["Light", "Regular", "Medium", "Semibold", "Bold", "Extrabold"];
const ALIGNS: { value: TextAlignValue; icon: React.ElementType; label: string }[] = [
  { value: "Left", icon: AlignLeft, label: "Align left" },
  { value: "Center", icon: AlignCenter, label: "Align center" },
  { value: "Right", icon: AlignRight, label: "Align right" },
  { value: "Justify", icon: AlignJustify, label: "Justify" },
];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-500 hover:text-ink-700"
      >
        {title}
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <span className="min-w-14 shrink-0 whitespace-nowrap text-[12px] font-medium text-ink-400">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
    </label>
  );
}

const inputCls =
  "w-full min-w-0 rounded-md border border-line bg-card px-2 py-1.5 text-[13px] font-medium text-ink-800 outline-none transition-colors focus:border-brand-400 disabled:opacity-50 disabled:bg-surface";

function NumberField({
  label,
  value,
  onCommit,
  suffix,
  step = 1,
  disabled,
  min,
  max,
  history = true,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  suffix?: string;
  step?: number;
  disabled?: boolean;
  min?: number;
  max?: number;
  history?: boolean;
}) {
  const started = useRef(false);
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? String(round(value, 2));

  const parse = (raw: string): number | null => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  return (
    <Row label={label}>
      <span className="relative min-w-0 flex-1">
        <input
          type="number"
          step={step}
          value={shown}
          disabled={disabled}
          onFocus={() => {
            started.current = false;
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parse(e.target.value);
            if (n === null) return;
            if (!started.current) {
              if (history) useEditor.getState().pushHistory();
              started.current = true;
            }
            onCommit(n);
          }}
          onBlur={() => {
            setText(null);
            started.current = false;
            const n = parse(shown);
            if (n !== null) onCommit(n);
          }}
          className={cn(inputCls, suffix && "pr-7", "appearance-none [&::-webkit-inner-spin-button]:appearance-none")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-ink-400">
            {suffix}
          </span>
        ) : null}
      </span>
    </Row>
  );
}

function ColorField({
  label,
  value,
  onCommit,
  disabled,
  allowNone,
  onGestureStart,
}: {
  label: string;
  value: string | null;
  onCommit: (value: string | null) => void;
  disabled?: boolean;
  allowNone?: boolean;
  onGestureStart?: () => void;
}) {
  const started = useRef(false);
  const [text, setText] = useState<string | null>(null);
  const hex = value ?? "#000000";
  const shown = text ?? (value ?? "none");

  const begin = () => {
    if (started.current) return;
    started.current = true;
    onGestureStart?.();
  };

  return (
    <Row label={label}>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={cn(
            "relative size-7 shrink-0 overflow-hidden rounded-md border border-line focus-within:ring-2 focus-within:ring-brand-500",
            !value && "bg-[repeating-conic-gradient(#fff_0_25%,#d0d5dd_0_50%)] bg-[length:10px_10px]",
          )}
        >
          <input
            type="color"
            value={hex}
            disabled={disabled}
            onFocus={() => {
              started.current = false;
            }}
            onChange={(e) => {
              begin();
              onCommit(e.target.value);
            }}
            onBlur={() => {
              started.current = false;
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`${label} color`}
          />
          {value ? <span className="pointer-events-none absolute inset-0" style={{ background: value }} /> : null}
        </span>
        <input
          value={shown}
          disabled={disabled}
          onFocus={() => {
            started.current = false;
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
              begin();
              onCommit(raw);
            } else if (raw === "" && allowNone) {
              begin();
              onCommit(null);
            }
          }}
          onBlur={() => {
            if (!/^#[0-9a-fA-F]{6}$/.test(shown) && shown !== "none" && allowNone) {
              begin();
              onCommit(null);
            }
            setText(null);
            started.current = false;
          }}
          className={cn(inputCls, "font-mono text-[12px]")}
          placeholder="#RRGGBB"
        />
        {allowNone ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              begin();
              onCommit(value === null ? "#101828" : null);
            }}
            className="shrink-0 rounded-md border border-line px-1.5 py-1 text-[11px] font-bold text-ink-500 hover:bg-line-soft disabled:opacity-50"
            title={value === null ? "Set color" : "Remove color"}
          >
            {value === null ? "Set" : "None"}
          </button>
        ) : null}
      </span>
    </Row>
  );
}

function EditActions({ selected }: { selected: DesignElementDto[] }) {
  if (selected.length < 2) return null;
  return (
    <div className="flex gap-2 px-4 pb-4">
      <button
        type="button"
        onClick={() => void useEditor.getState().duplicateSelected()}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-2 py-2 text-[12px] font-semibold text-ink-700 hover:bg-line-soft"
      >
        <Copy className="size-3.5" /> Duplicate
      </button>
      <button
        type="button"
        onClick={() => void useEditor.getState().deleteSelected()}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-danger/30 px-2 py-2 text-[12px] font-semibold text-danger hover:bg-red-50"
      >
        <Trash2 className="size-3.5" /> Delete
      </button>
    </div>
  );
}

function ElementForm({ element, disabled }: { element: DesignElementDto; disabled: boolean }) {
  const textStarted = useRef(false);

  const update = (patch: UpdateElementPayload, immediate = false) =>
    useEditor.getState().updateElement(element.id, patch, { immediate });

  const pushHistory = () => useEditor.getState().pushHistory();

  const beginTextEdit = () => {
    if (textStarted.current) return;
    textStarted.current = true;
    pushHistory();
  };

  const endTextEdit = () => {
    textStarted.current = false;
  };

  const isText = element.type === "Text";
  const isShape = element.type === "Rectangle" || element.type === "Ellipse" || element.type === "Frame";
  const isStrokeShape =
    element.type === "Rectangle" || element.type === "Ellipse" || element.type === "Line" || element.type === "Pencil" || element.type === "Frame";

  return (
    <>
      <Section title="Layer">
        <Row label="Name">
          <input
            value={element.name}
            disabled={disabled}
            onFocus={endTextEdit}
            onBlur={endTextEdit}
            onChange={(e) => {
              beginTextEdit();
              update({ name: e.target.value });
            }}
            className={inputCls}
          />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={element.x} disabled={disabled} onCommit={(v) => update({ x: v })} />
          <NumberField label="Y" value={element.y} disabled={disabled} onCommit={(v) => update({ y: v })} />
          <NumberField
            label="W"
            value={element.width}
            disabled={disabled}
            min={1}
            onCommit={(v) => update({ width: v })}
          />
          <NumberField
            label="H"
            value={element.height}
            disabled={disabled}
            min={1}
            onCommit={(v) => update({ height: v })}
          />
          <NumberField
            label="Angle"
            value={element.rotation}
            disabled={disabled}
            suffix="°"
            onCommit={(v) => update({ rotation: v })}
          />
          <NumberField
            label="Opacity"
            value={Math.round(element.opacity * 100)}
            disabled={disabled}
            suffix="%"
            min={0}
            max={100}
            onCommit={(v) => update({ opacity: v / 100 })}
          />
        </div>
        {isShape && element.type !== "Frame" ? (
          <NumberField
            label="Radius"
            value={element.cornerRadius}
            disabled={disabled}
            min={0}
            onCommit={(v) => update({ cornerRadius: v })}
          />
        ) : null}
      </Section>

      {isText ? (
        <Section title="Typography">
          <Row label="Text">
            <textarea
              value={element.text ?? ""}
              disabled={disabled}
              onFocus={endTextEdit}
              onBlur={endTextEdit}
              onChange={(e) => {
                beginTextEdit();
                update({ text: e.target.value });
              }}
              rows={2}
              className={cn(inputCls, "resize-none")}
            />
          </Row>
          <Row label="Font">
            <select
              value={element.fontFamily}
              disabled={disabled}
              onChange={(e) => {
                pushHistory();
                update({ fontFamily: e.target.value }, true);
              }}
              className={inputCls}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Size"
              value={element.fontSize}
              disabled={disabled}
              min={4}
              onCommit={(v) => update({ fontSize: v })}
            />
            <NumberField
              label="Line"
              value={element.lineHeight}
              disabled={disabled}
              step={0.05}
              min={0.5}
              max={4}
              onCommit={(v) => update({ lineHeight: v })}
            />
          </div>
          <Row label="Weight">
            <select
              value={element.fontWeight}
              disabled={disabled}
              onChange={(e) => {
                pushHistory();
                update({ fontWeight: e.target.value as FontWeightValue }, true);
              }}
              className={inputCls}
            >
              {WEIGHTS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Align">
            <span className="flex gap-1">
              {ALIGNS.map((align) => (
                <button
                  key={align.value}
                  type="button"
                  disabled={disabled}
                  aria-label={align.label}
                  aria-pressed={element.textAlign === align.value}
                  onClick={() => {
                    if (element.textAlign === align.value) return;
                    pushHistory();
                    update({ textAlign: align.value }, true);
                  }}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border transition-colors disabled:opacity-40",
                    element.textAlign === align.value
                      ? "border-brand-200 bg-brand-50 text-brand-600"
                      : "border-line text-ink-500 hover:bg-line-soft",
                  )}
                >
                  <align.icon className="size-3.5" />
                </button>
              ))}
            </span>
          </Row>
        </Section>
      ) : null}

      <Section title={isText ? "Color" : "Fill & stroke"}>
        <ColorField label={isText ? "Text" : "Fill"} value={element.fill} disabled={disabled} allowNone={!isText} onGestureStart={pushHistory} onCommit={(v) => update({ fill: v }, true)} />
        {isStrokeShape ? (
          <>
            <ColorField label="Stroke" value={element.stroke} disabled={disabled} allowNone onGestureStart={pushHistory} onCommit={(v) => update({ stroke: v }, true)} />
            <NumberField
              label="Weight"
              value={element.strokeWidth}
              disabled={disabled || !element.stroke}
              min={0}
              max={80}
              onCommit={(v) => update({ strokeWidth: v })}
            />
          </>
        ) : null}
      </Section>

      {element.type === "Image" ? (
        <Section title="Image" defaultOpen={false}>
          <p className="text-[12px] leading-relaxed text-ink-500">
            Images are stored with the design. Replace by deleting this layer and dropping a new image with the
            image tool.
          </p>
        </Section>
      ) : null}

      <PrototypeSection element={element} disabled={disabled} onHistoryStart={pushHistory} onUpdate={update} />
    </>
  );
}

function PrototypeSection({
  element,
  disabled,
  onHistoryStart,
  onUpdate,
}: {
  element: DesignElementDto;
  disabled: boolean;
  onHistoryStart: () => void;
  onUpdate: (patch: UpdateElementPayload, immediate?: boolean) => void;
}) {
  const roomId = useEditor((s) => s.roomId);
  const designs = useEditor((s) => s.designs);

  useEffect(() => {
    if (!roomId || designs.length > 0 || requestedRoomDesigns.has(roomId)) return;
    requestedRoomDesigns.add(roomId);
    void api
      .get<RoomDetail>(`/rooms/${roomId}`)
      .then((room) => useEditor.getState().setDesigns(room.designs))
      .catch(() => requestedRoomDesigns.delete(roomId));
  }, [roomId, designs.length]);

  const linkedId = element.linkToDesignId ?? "";
  const targetKnown = !linkedId || designs.some((design) => design.id === linkedId);

  return (
    <Section title="Prototype" defaultOpen={Boolean(linkedId)}>
      <Row label="On click">
        <select
          value={linkedId}
          disabled={disabled}
          onChange={(e) => {
            onHistoryStart();
            onUpdate({ linkToDesignId: e.target.value ? e.target.value : null }, true);
          }}
          className={inputCls}
          aria-label="On click navigate to"
        >
          <option value="">None</option>
          {designs.map((design) => (
            <option key={design.id} value={design.id}>
              {design.name}
            </option>
          ))}
          {!targetKnown ? <option value={linkedId}>(missing page)</option> : null}
        </select>
      </Row>
      <p className="text-[12px] leading-relaxed text-ink-500">
        In Present mode, clicking this layer navigates to the linked page.
      </p>
    </Section>
  );
}

function DesignForm() {
  const width = useEditor((s) => s.designWidth);
  const height = useEditor((s) => s.designHeight);
  const background = useEditor((s) => s.designBackground);
  const canEdit = useEditor((s) => s.canEdit);
  const disabled = !canEdit;

  const setDesign = (patch: { designWidth?: number; designHeight?: number; designBackground?: string }) => {
    useEditor.setState(patch);
    useEditor.getState().markDirty();
  };

  return (
    <>
      <Section title="Canvas">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="W"
            value={width}
            disabled={disabled}
            min={1}
            max={8000}
            history={false}
            onCommit={(v) => setDesign({ designWidth: Math.round(v) })}
          />
          <NumberField
            label="H"
            value={height}
            disabled={disabled}
            min={1}
            max={8000}
            history={false}
            onCommit={(v) => setDesign({ designHeight: Math.round(v) })}
          />
        </div>
        <ColorField
          label="Background"
          value={background}
          disabled={disabled}
          onCommit={(v) => setDesign({ designBackground: v ?? "#FFFFFF" })}
        />
      </Section>
      <div className="px-4 py-6 text-center text-[12px] leading-relaxed text-ink-400">
        <MousePointer className="mx-auto mb-2 size-5" />
        Select a layer on the canvas or in the layers panel to edit its properties.
      </div>
    </>
  );
}

export function PropertiesPanel() {
  const elements = useEditor((s) => s.elements);
  const selection = useEditor((s) => s.selection);
  const canEdit = useEditor((s) => s.canEdit);
  const selected = elements.filter((e) => selection.includes(e.id));

  return (
    <div className="flex h-full flex-col">
      {selected.length > 1 ? (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-[13px] font-bold text-ink-900">Selection</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
            {selected.length} layers
          </span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selected.length === 0 ? (
          <DesignForm />
        ) : selected.length === 1 ? (
          <ElementForm element={selected[0]} disabled={!canEdit} />
        ) : (
          <>
            <Section title={`Selection (${selected.length})`}>
              <p className="text-[12px] leading-relaxed text-ink-500">
                Multiple layers selected. Move them together on the canvas, or use the actions below.
              </p>
            </Section>
            <EditActions selected={selected} />
          </>
        )}
      </div>
    </div>
  );
}
