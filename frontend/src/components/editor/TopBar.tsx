"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardCopy,
  CopyPlus,
  Download,
  FileCode2,
  FileImage,
  FileJson,
  Keyboard,
  Layers,
  Link2,
  Pencil,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ShareRoomModal } from "@/components/dashboard/ShareRoomModal";
import { api, ApiError } from "@/lib/api";
import { buildDesignSvg, buildElementCss, downloadBlob, exportDesignPng, safeFilename } from "@/lib/export";
import { downloadJson } from "@/lib/utils";
import { useEditor } from "@/store/editor";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import type { DesignDto, RoomSummary } from "@/lib/types";

function SaveChip() {
  const status = useEditor((s) => s.saveStatus);
  const flushSave = useEditor((s) => s.flushSave);

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-500">
        <Spinner className="size-3.5" /> Saving…
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-500">
        <span className="size-1.5 rounded-full bg-flame-500" /> Unsaved
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => void flushSave()}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-danger hover:bg-red-100"
      >
        <AlertTriangle className="size-3.5" /> Retry save
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-500">
      <Check className="size-3.5 text-live" /> Saved
    </span>
  );
}

export function TopBar({
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}: {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}) {
  const router = useRouter();
  const roomId = useEditor((s) => s.roomId);
  const roomName = useEditor((s) => s.roomName);
  const role = useEditor((s) => s.role);
  const canEdit = useEditor((s) => s.canEdit);
  const presence = useEditor((s) => s.presence);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);
  const designs = useEditor((s) => s.designs);
  const designId = useEditor((s) => s.designId);
  const designName = useEditor((s) => s.designName);
  const designWidth = useEditor((s) => s.designWidth);
  const designHeight = useEditor((s) => s.designHeight);
  const designBackground = useEditor((s) => s.designBackground);
  const elements = useEditor((s) => s.elements);
  const selection = useEditor((s) => s.selection);
  const panX = useEditor((s) => s.panX);
  const panY = useEditor((s) => s.panY);

  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);

  const selectedElement =
    selection.length === 1 ? elements.find((element) => element.id === selection[0]) : undefined;

  const people = Object.values(presence).map((p) => ({
    id: p.userId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    color: p.color,
  }));

  async function rename(value: string) {
    try {
      await useEditor.getState().renameRoom(value);
      toast.success("Room renamed");
    } catch (err) {
      throw new Error(err instanceof ApiError ? err.message : "Could not rename this room");
    }
  }

  async function duplicateRoom() {
    if (!roomId) return;
    try {
      const room = await api.post<RoomSummary>(`/rooms/${roomId}/duplicate`);
      toast.success("Room duplicated");
      router.push(`/editor?room=${room.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not duplicate this room");
    }
  }

  async function deleteRoom() {
    if (!roomId) return;
    await api.delete(`/rooms/${roomId}`);
    toast.success("Room deleted");
    router.push("/dashboard");
  }

  function openPage(nextDesignId: string) {
    if (!roomId || nextDesignId === designId) return;
    void useEditor.getState().loadDesign(nextDesignId);
  }

  async function createPage(name: string) {
    if (!roomId) return;
    try {
      const design = await api.post<DesignDto>(`/rooms/${roomId}/designs`, { name });
      useEditor.getState().setDesigns([...useEditor.getState().designs, design]);
      toast.success("Page created");
      void useEditor.getState().loadDesign(design.id);
    } catch (err) {
      throw new Error(err instanceof ApiError ? err.message : "Could not create the page");
    }
  }

  async function exportPng() {
    try {
      await exportDesignPng({
        name: designName,
        width: designWidth,
        height: designHeight,
        panX,
        panY,
      });
      toast.success("PNG exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export the PNG");
    }
  }

  function exportSvg() {
    try {
      const svg = buildDesignSvg({
        name: designName,
        width: designWidth,
        height: designHeight,
        backgroundColor: designBackground,
        elements,
      });
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${safeFilename(designName)}.svg`);
      toast.success("SVG exported");
    } catch {
      toast.error("Could not export the SVG");
    }
  }

  function exportJson() {
    downloadJson(
      {
        name: designName,
        width: designWidth,
        height: designHeight,
        backgroundColor: designBackground,
        elements,
      },
      `${safeFilename(designName)}.json`,
    );
    toast.success("Design JSON downloaded");
  }

  async function copyCss() {
    if (!selectedElement) return;
    try {
      await navigator.clipboard.writeText(buildElementCss(selectedElement));
      toast.success("CSS copied to clipboard");
    } catch {
      toast.error("Could not copy the CSS");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-card px-3">
      <Tooltip label="Back to dashboard" side="bottom">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to dashboard"
          className="flex size-9 items-center justify-center rounded-md text-ink-500 hover:bg-line-soft hover:text-ink-900"
        >
          <ArrowLeft className="size-4.5" />
        </button>
      </Tooltip>

      <LogoMark size={26} />

      <Menu
        align="left"
        trigger={
          <button
            type="button"
            className="group flex max-w-56 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-line-soft"
          >
            <span className="truncate text-sm font-bold text-ink-900">{roomName}</span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-400" />
          </button>
        }
      >
        {(close) => (
          <>
            <MenuItem
              icon={<Pencil className="size-4" />}
              disabled={!canEdit}
              onClick={() => {
                close();
                setRenaming(true);
              }}
            >
              Rename room
            </MenuItem>
            <MenuItem
              icon={<Link2 className="size-4" />}
              onClick={() => {
                close();
                setSharing(true);
              }}
            >
              Share…
            </MenuItem>
            <MenuItem
              icon={<CopyPlus className="size-4" />}
              onClick={() => {
                close();
                void duplicateRoom();
              }}
            >
              Duplicate room
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Pages</MenuLabel>
            {designs.map((page) => (
              <MenuItem
                key={page.id}
                icon={
                  page.id === designId ? (
                    <Check className="size-4 text-brand-600" />
                  ) : (
                    <span className="size-4" />
                  )
                }
                onClick={() => {
                  close();
                  openPage(page.id);
                }}
              >
                <span className="truncate">{page.name}</span>
              </MenuItem>
            ))}
            <MenuItem
              icon={<Plus className="size-4" />}
              disabled={!canEdit}
              onClick={() => {
                close();
                setCreatingPage(true);
              }}
            >
              New page
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={<Keyboard className="size-4" />}
              onClick={() => {
                close();
                setShortcutsOpen(true);
              }}
            >
              Keyboard shortcuts
            </MenuItem>
            {role === "Owner" ? (
              <>
                <MenuSeparator />
                <MenuItem
                  danger
                  icon={<Trash2 className="size-4" />}
                  onClick={() => {
                    close();
                    setConfirmDelete(true);
                  }}
                >
                  Delete room
                </MenuItem>
              </>
            ) : null}
          </>
        )}
      </Menu>

      {!canEdit ? <Badge tone="gray">View only</Badge> : role === "Editor" ? <Badge tone="purple">Editor</Badge> : null}

      <div className="flex-1" />

      <SaveChip />

      <div className="hidden sm:block">
        <AvatarStack people={people} size="xs" max={4} />
      </div>

      <Menu
        align="right"
        trigger={
          <Button
            size="sm"
            variant="secondary"
            icon={<Download className="size-4" />}
            className="hidden sm:inline-flex"
          >
            Export
          </Button>
        }
      >
        {(close) => (
          <>
            <MenuItem
              icon={<FileImage className="size-4" />}
              onClick={() => {
                close();
                void exportPng();
              }}
            >
              PNG image
            </MenuItem>
            <MenuItem
              icon={<FileCode2 className="size-4" />}
              onClick={() => {
                close();
                exportSvg();
              }}
            >
              SVG image
            </MenuItem>
            <MenuItem
              icon={<ClipboardCopy className="size-4" />}
              disabled={!selectedElement}
              onClick={() => {
                close();
                void copyCss();
              }}
            >
              Copy CSS
            </MenuItem>
            <MenuItem
              icon={<FileJson className="size-4" />}
              onClick={() => {
                close();
                exportJson();
              }}
            >
              Download JSON
            </MenuItem>
          </>
        )}
      </Menu>

      <Button
        size="sm"
        icon={<Link2 className="size-4" />}
        onClick={() => setSharing(true)}
        className="hidden sm:inline-flex"
      >
        Share
      </Button>

      <Button
        size="sm"
        variant="secondary"
        icon={<Play className="size-4" />}
        onClick={() => useEditor.getState().setPresentOpen(true)}
      >
        Present
      </Button>

      <Tooltip label="Keyboard shortcuts" side="bottom">
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          className="hidden size-9 items-center justify-center rounded-md text-ink-500 hover:bg-line-soft hover:text-ink-900 md:flex"
        >
          <Keyboard className="size-4" />
        </button>
      </Tooltip>

      <ThemeToggle />

      <Tooltip label={leftOpen ? "Hide layers" : "Show layers"} side="bottom">
        <button
          type="button"
          onClick={onToggleLeft}
          aria-label={leftOpen ? "Hide layers" : "Show layers"}
          aria-pressed={leftOpen}
          className={cn(
            "flex size-9 items-center justify-center rounded-md hover:bg-line-soft lg:hidden",
            leftOpen ? "bg-brand-50 text-brand-600" : "text-ink-500",
          )}
        >
          <Layers className="size-4" />
        </button>
      </Tooltip>
      <Tooltip label={rightOpen ? "Hide properties" : "Show properties"} side="bottom">
        <button
          type="button"
          onClick={onToggleRight}
          aria-label={rightOpen ? "Hide properties" : "Show properties"}
          aria-pressed={rightOpen}
          className={cn(
            "flex size-9 items-center justify-center rounded-md hover:bg-line-soft lg:hidden",
            rightOpen ? "bg-brand-50 text-brand-600" : "text-ink-500",
          )}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </Tooltip>

      <PromptDialog
        open={renaming}
        title="Rename room"
        label="Room name"
        initialValue={roomName}
        onClose={() => setRenaming(false)}
        onSubmit={rename}
      />

      <PromptDialog
        open={creatingPage}
        title="New page"
        label="Page name"
        initialValue="Design 2"
        submitLabel="Create page"
        onClose={() => setCreatingPage(false)}
        onSubmit={createPage}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${roomName}”?`}
        description="This permanently removes the room, its designs, elements, and comments. This cannot be undone."
        confirmLabel="Delete room"
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteRoom}
      />

      {roomId ? (
        <ShareRoomModal open={sharing} roomId={roomId} roomName={roomName} onClose={() => setSharing(false)} />
      ) : null}
    </header>
  );
}
