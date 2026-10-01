"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { History, Loader2, RotateCcw, Save } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { useEditor } from "@/store/editor";
import { toast } from "@/store/toast";
import { relativeTime } from "@/lib/utils";
import type { RevisionSummary } from "@/lib/types";

const inputCls =
  "w-full min-w-0 rounded-md border border-line bg-card px-2 py-1.5 text-[13px] font-medium text-ink-800 outline-none transition-colors focus:border-brand-400 disabled:opacity-50";

export function HistoryPanel() {
  const designId = useEditor((s) => s.designId);
  const canEdit = useEditor((s) => s.canEdit);

  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompting, setPrompting] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<RevisionSummary | null>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!designId) {
      setRevisions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const token = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const list = await api.get<RevisionSummary[]>(`/designs/${designId}/revisions`);
      if (token !== requestRef.current) return;
      setRevisions(list);
    } catch (err) {
      if (token !== requestRef.current) return;
      setError(err instanceof ApiError ? err.message : "Could not load versions");
    } finally {
      if (token === requestRef.current) setLoading(false);
    }
  }, [designId]);

  useEffect(() => {
    void refresh();
    return () => {
      requestRef.current += 1;
    };
  }, [refresh]);

  async function saveVersion() {
    if (saving) return;
    setSaving(true);
    try {
      await useEditor.getState().createRevision(label.trim() || undefined);
      setLabel("");
      setPrompting(false);
      toast.success("Version saved");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save this version");
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion() {
    if (!target) return;
    await useEditor.getState().restoreRevision(target.id);
    toast.success("Version restored");
    await refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-3">
        <p className="text-[13px] font-bold text-ink-900">Version history</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-400">
          Snapshots are captured automatically as this design saves.
        </p>
        {canEdit ? (
          prompting ? (
            <div className="mt-2.5 flex items-center gap-1.5">
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") void saveVersion();
                  if (e.key === "Escape") {
                    setPrompting(false);
                    setLabel("");
                  }
                }}
                placeholder="Version name (optional)"
                className={inputCls}
                aria-label="Version name"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveVersion()}
                className="shrink-0 rounded-md bg-brand-600 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompting(false);
                  setLabel("");
                }}
                className="shrink-0 rounded-md border border-line px-2 py-1.5 text-[12px] font-semibold text-ink-500 hover:bg-line-soft"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPrompting(true)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-brand-700"
            >
              <Save className="size-3.5" /> Save version
            </button>
          )
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-ink-400">
            <Loader2 className="size-4 animate-spin" /> Loading versions…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-[13px] leading-relaxed text-ink-400">
            <History className="mx-auto mb-2 size-5" />
            {error}
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-3 block w-full rounded-md border border-line px-3 py-2 text-[12px] font-semibold text-ink-600 hover:bg-line-soft"
            >
              Try again
            </button>
          </div>
        ) : revisions.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] leading-relaxed text-ink-400">
            <History className="mx-auto mb-2 size-5" />
            No versions yet.
            <br />
            {canEdit ? "Save a version to keep a restore point." : "Editors can capture versions of this design."}
          </div>
        ) : (
          revisions.map((revision) => (
            <div key={revision.id} className="rounded-lg border border-line bg-card p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink-900">
                  {revision.label?.trim() ? revision.label : "Unnamed version"}
                </span>
                <span className="shrink-0 text-[11px] text-ink-400">{relativeTime(revision.createdAt)}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500">
                <span>{revision.createdByName}</span>
                <span>{revision.elementCount} layers</span>
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setTarget(revision)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-line-soft"
                >
                  <RotateCcw className="size-3.5" /> Restore
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title="Restore this version?"
        description={
          target
            ? `The design returns to “${target.label?.trim() ? target.label : "Unnamed version"}” from ${relativeTime(
                target.createdAt,
              )}. A backup of the current state is kept first.`
            : undefined
        }
        confirmLabel="Restore version"
        danger={false}
        onClose={() => setTarget(null)}
        onConfirm={restoreVersion}
      />
    </div>
  );
}
