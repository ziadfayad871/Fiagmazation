"use client";

import { Modal } from "@/components/ui/Modal";
import { useEditor } from "@/store/editor";

const groups: { title: string; rows: [string, string][] }[] = [
  {
    title: "Tools",
    rows: [
      ["Select", "V"],
      ["Hand / pan", "H"],
      ["Frame", "F"],
      ["Rectangle", "R"],
      ["Ellipse", "O"],
      ["Line", "L"],
      ["Pencil", "P"],
      ["Text", "T"],
      ["Image", "I"],
      ["Comment", "C"],
    ],
  },
  {
    title: "Editing",
    rows: [
      ["Undo", "Ctrl+Z"],
      ["Redo", "Ctrl+Shift+Z"],
      ["Copy", "Ctrl+C"],
      ["Cut", "Ctrl+X"],
      ["Paste", "Ctrl+V"],
      ["Duplicate", "Ctrl+D"],
      ["Select all", "Ctrl+A"],
      ["Delete selection", "Del"],
      ["Bring to front", "]"],
      ["Send to back", "["],
    ],
  },
  {
    title: "View",
    rows: [
      ["Zoom in / out", "+ / -"],
      ["Zoom to 100%", "1"],
      ["Fit to screen", "0"],
      ["Toggle grid", "Ctrl+'"],
      ["Save now", "Ctrl+S"],
      ["Close menu / deselect", "Esc"],
      ["Pan while drawing", "Space + drag"],
    ],
  },
];

export function ShortcutsModal() {
  const open = useEditor((s) => s.shortcutsOpen);
  const setOpen = useEditor((s) => s.setShortcutsOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts" size="lg">
      <div className="grid gap-6 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">{group.title}</h3>
            <ul className="space-y-1.5">
              {group.rows.map(([label, keys]) => (
                <li key={label} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-ink-700">{label}</span>
                  <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-500">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
