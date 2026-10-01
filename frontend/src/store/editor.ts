import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import { joinRoom, leaveRoom, notify, type JoinResult } from "@/lib/roomSocket";
import { toast } from "@/store/toast";
import { clamp, uid } from "@/lib/utils";
import type {
  CommentDto,
  CreateElementPayload,
  CreateRevisionResult,
  DesignElementDto,
  DesignDto,
  DesignSummary,
  ElementType,
  PagedResult,
  RoomMember,
  RoomRole,
  RoomSummary,
  SaveStatus,
  ToolType,
  UpdateElementPayload,
} from "@/lib/types";

const clone = <T,>(value: T): T =>
  typeof structuredClone === "function" ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);

const byZ = (a: DesignElementDto, b: DesignElementDto) => a.zIndex - b.zIndex;

function designStatePatch(design: DesignDto): Partial<EditorState> {
  return {
    designId: design.id,
    designName: design.name,
    designWidth: design.width,
    designHeight: design.height,
    designBackground: design.backgroundColor,
    elements: [...design.elements].sort(byZ),
    selection: [],
    past: [],
    future: [],
    saveStatus: "saved",
    lastSavedAt: null,
    contextMenu: null,
    editingTextId: null,
    draft: null,
    marquee: null,
    activeCommentId: null,
    pendingComment: null,
  };
}

function captureRevision(designId: string): void {
  void api.post(`/designs/${designId}/revisions`, {}).catch(() => {
    /* version history is best effort — the server also throttles captures */
  });
}

const pendingPatches = new Map<string, UpdateElementPayload>();
const pendingRemoteUpdates = new Map<string, { elementId: string; patch: UpdateElementPayload }>();
let patchTimer: number | null = null;
let saveTimer: number | null = null;
let patchQueue: Promise<void> = Promise.resolve();
let saveSeq = 0;
let loadGeneration = 0;
let lastCursorSent = 0;
let lastSelectionSent = 0;

function clearTimers(): void {
  if (patchTimer !== null) window.clearTimeout(patchTimer);
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  patchTimer = null;
  saveTimer = null;
}

export interface DraftShape {
  type: ElementType;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: number[];
}

interface PresenceEntry {
  userId: string;
  displayName: string;
  color: string;
  avatarUrl?: string | null;
  cursorX?: number | null;
  cursorY?: number | null;
}

interface CursorEntry {
  displayName: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number;
}

interface RemoteSelectionEntry {
  displayName: string;
  color: string;
  ids: string[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  targetId: string | null;
}

export type RightTab = "design" | "comments" | "history";

interface EditorState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  roomId: string | null;
  designId: string | null;
  roomName: string;
  designName: string;
  role: RoomRole;
  canEdit: boolean;
  designs: DesignSummary[];

  designWidth: number;
  designHeight: number;
  designBackground: string;

  elements: DesignElementDto[];
  selection: string[];
  tool: ToolType;
  zoom: number;
  panX: number;
  panY: number;
  gridVisible: boolean;

  saveStatus: SaveStatus;
  lastSavedAt: string | null;

  past: DesignElementDto[][];
  future: DesignElementDto[][];

  members: RoomMember[];
  presence: Record<string, PresenceEntry>;
  cursors: Record<string, CursorEntry>;
  remoteSelections: Record<string, RemoteSelectionEntry>;
  selfUserId: string | null;

  comments: CommentDto[];
  activeCommentId: string | null;
  pendingComment: { x: number; y: number } | null;
  rightTab: RightTab;
  contextMenu: ContextMenuState | null;
  editingTextId: string | null;
  draft: DraftShape | null;
  marquee: { x1: number; y1: number; x2: number; y2: number } | null;
  shortcutsOpen: boolean;
  presentOpen: boolean;

  load: (roomId: string, selfUserId: string) => Promise<void>;
  leave: () => Promise<void>;
  resync: () => Promise<void>;
  handleRejoin: () => Promise<void>;
  loadDesign: (designId: string) => Promise<void>;
  applyDesign: (design: DesignDto) => void;
  setDesigns: (designs: DesignSummary[]) => void;
  createRevision: (label?: string) => Promise<void>;
  restoreRevision: (revisionId: string) => Promise<void>;

  setTool: (tool: ToolType) => void;
  setViewport: (patch: { zoom?: number; panX?: number; panY?: number }) => void;
  toggleGrid: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setPresentOpen: (open: boolean) => void;
  setRightTab: (tab: RightTab) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setEditingText: (id: string | null) => void;
  setDraft: (draft: DraftShape | null) => void;
  setMarquee: (rect: EditorState["marquee"]) => void;

  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  addElement: (input: CreateElementPayload) => Promise<DesignElementDto | null>;
  updateElement: (id: string, patch: UpdateElementPayload, opts?: { immediate?: boolean }) => void;
  previewPositions: (positions: { id: string; x: number; y: number }[]) => void;
  commitMove: (ids: string[]) => void;
  deleteElements: (ids: string[]) => Promise<void>;
  deleteSelected: () => Promise<void>;
  duplicateSelected: () => Promise<void>;
  copySelected: () => void;
  pasteClipboard: () => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
  bringToFront: () => Promise<void>;
  sendToBack: () => Promise<void>;

  markDirty: () => void;
  flushSave: (opts?: { silent?: boolean }) => Promise<void>;
  flushBatch: () => Promise<void>;

  scheduleCursor: (x: number, y: number) => void;
  scheduleSelection: () => void;

  loadComments: () => Promise<void>;
  createComment: (input: { body: string; x: number; y: number; parentId?: string }) => Promise<void>;
  updateComment: (id: string, body: string) => Promise<void>;
  resolveComment: (id: string, resolved: boolean) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  setActiveComment: (id: string | null) => void;
  setPendingComment: (point: { x: number; y: number } | null) => void;

  memberJoined: (payload: { userId: string; displayName: string; color: string; selection?: string[] }) => void;
  memberLeft: (payload: { userId: string }) => void;
  remoteCursor: (payload: { userId: string; x: number; y: number }) => void;
  remoteSelection: (payload: { userId: string; elementIds: string[] }) => void;
  remoteCreated: (element: DesignElementDto) => void;
  remoteUpdated: (payload: { elementId: string; patch: UpdateElementPayload }) => void;
  remoteDeleted: (ids: string[]) => void;
  remoteReordered: (ids: string[]) => void;
  applyJoinResult: (result: JoinResult) => void;

  renameRoom: (name: string) => Promise<void>;
}

let clipboard: DesignElementDto[] = [];

const DEFAULT_FILL: Record<ElementType, string | null> = {
  Rectangle: "#3B5BFE",
  Ellipse: "#F5741F",
  Frame: "#FFFFFF",
  Line: null,
  Pencil: null,
  Text: "#101828",
  Image: null,
};

export const useEditor = create<EditorState>((set, get) => {
  function identityFor(userId: string): { displayName: string; color: string; avatarUrl?: string | null } {
    const state = get();
    const presence = state.presence[userId];
    if (presence) return presence;
    const member = state.members.find((m) => m.user.id === userId);
    if (member) {
      return { displayName: member.user.displayName, color: member.user.color, avatarUrl: member.user.avatarUrl };
    }
    return { displayName: "Guest", color: "#2563EB" };
  }

  function requireEditor(): boolean {
    const state = get();
    if (!state.canEdit) {
      toast.info("Viewers cannot change this design");
      return false;
    }
    return true;
  }

  async function salvageDesignEdits(): Promise<void> {
    clearTimers();
    if (pendingPatches.size > 0) {
      const staleDesignId = get().designId;
      const staleRoomId = get().roomId;
      const staleEntries = Array.from(pendingPatches.entries());
      pendingPatches.clear();
      if (staleDesignId && staleRoomId) {
        for (const [id, patch] of staleEntries) {
          void api
            .patch(`/designs/${staleDesignId}/elements/${id}`, patch)
            .then(() => notify("ElementUpdated", staleRoomId, staleDesignId, id, patch))
            .catch(() => {
              /* previous design — best effort */
            });
        }
      }
    }
    pendingRemoteUpdates.clear();
  }

  function markDirty(): void {
    const state = get();
    if (!state.canEdit) return;
    // a new save cycle starts here — any in-flight flush may no longer
    // publish its status once it resolves (M12).
    saveSeq += 1;
    set({ saveStatus: "unsaved" });
    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      void get().flushSave();
    }, 30000);
  }

  function flushPatches(): Promise<void> {
    patchQueue = patchQueue.then(async () => {
      if (pendingPatches.size === 0) return;
      const entries = Array.from(pendingPatches.entries());
      pendingPatches.clear();
      const { designId, roomId } = get();
      if (!designId || !roomId) return;

      const seq = ++saveSeq;
      set({ saveStatus: "saving" });
      const failedIds = new Set<string>();

      await Promise.all(
        entries.map(async ([id, patch]) => {
          try {
            const updated = await api.patch<DesignElementDto>(
              `/designs/${designId}/elements/${id}`,
              patch,
            );
            if (!pendingPatches.has(id)) {
              set((s) => ({ elements: s.elements.map((e) => (e.id === id ? updated : e)) }));
            }
            notify("ElementUpdated", roomId, designId, id, patch);
          } catch (err) {
            console.error("Failed to sync element", err);
            failedIds.add(id);
          }
        }),
      );

      if (failedIds.size > 0) {
        // re-queue failed edits instead of dropping them (M10); a newer patch
        // queued meanwhile wins on conflicting fields.
        for (const [id, patch] of entries) {
          if (!failedIds.has(id)) continue;
          const existing = pendingPatches.get(id);
          pendingPatches.set(id, existing ? { ...patch, ...existing } : patch);
        }
        if (seq === saveSeq) set({ saveStatus: "error" });
      } else if (seq === saveSeq) {
        set({ saveStatus: "saved", lastSavedAt: new Date().toISOString() });
      }

      // apply remote updates that were skipped while a local patch was pending (H3)
      if (pendingRemoteUpdates.size > 0) {
        for (const [id, payload] of Array.from(pendingRemoteUpdates.entries())) {
          if (pendingPatches.has(id)) continue;
          pendingRemoteUpdates.delete(id);
          set((s) => ({
            elements: s.elements.map((e) => (e.id === id ? { ...e, ...payload.patch } : e)),
          }));
        }
      }
    });
    return patchQueue;
  }

  function schedulePatch(id: string, patch: UpdateElementPayload): void {
    const existing = pendingPatches.get(id);
    pendingPatches.set(id, existing ? { ...existing, ...patch } : patch);
    if (patchTimer !== null) window.clearTimeout(patchTimer);
    patchTimer = window.setTimeout(() => {
      patchTimer = null;
      void flushPatches();
    }, 350);
  }

  function broadcastDiff(prev: DesignElementDto[], next: DesignElementDto[]): void {
    const { designId, roomId } = get();
    if (!designId || !roomId) return;
    const prevMap = new Map(prev.map((e) => [e.id, e]));
    const nextMap = new Map(next.map((e) => [e.id, e]));

    const deleted = prev.filter((e) => !nextMap.has(e.id)).map((e) => e.id);
    if (deleted.length > 0) notify("ElementsDeleted", roomId, designId, deleted);

    for (const element of next) {
      const before = prevMap.get(element.id);
      if (!before) {
        notify("ElementCreated", roomId, designId, element);
      } else if (JSON.stringify(before) !== JSON.stringify(element)) {
        notify("ElementUpdated", roomId, designId, element.id, elementToPatch(element));
      }
    }
  }

  return {
    status: "idle",
    error: null,
    roomId: null,
    designId: null,
    roomName: "",
    designName: "Design",
    role: "Viewer",
    canEdit: false,
    designs: [],
    designWidth: 1440,
    designHeight: 900,
    designBackground: "#FFFFFF",
    elements: [],
    selection: [],
    tool: "select",
    zoom: 1,
    panX: 0,
    panY: 0,
    gridVisible: true,
    saveStatus: "saved",
    lastSavedAt: null,
    past: [],
    future: [],
    members: [],
    presence: {},
    cursors: {},
    remoteSelections: {},
    selfUserId: null,
    comments: [],
    activeCommentId: null,
    pendingComment: null,
    rightTab: "design",
    contextMenu: null,
    editingTextId: null,
    draft: null,
    marquee: null,
    shortcutsOpen: false,
    presentOpen: false,

    async load(roomId, selfUserId) {
      const generation = ++loadGeneration;

      await salvageDesignEdits();

      set({ status: "loading", error: null, roomId, selfUserId });
      try {
        const room = await api.get<RoomSummary & { members: RoomMember[]; designs: DesignSummary[] }>(
          `/rooms/${roomId}`,
        );
        if (generation !== loadGeneration) return;

        let design: DesignDto;
        if (room.designs.length > 0) {
          design = await api.get<DesignDto>(`/rooms/${roomId}/design`);
        } else {
          design = await api.post<DesignDto>(`/rooms/${roomId}/designs`, { name: "Design 1" });
          room.designs = [design];
        }
        if (generation !== loadGeneration) return;

        const [joinResult, comments] = await Promise.all([
          joinRoom(roomId),
          api.get<CommentDto[]>(`/designs/${design.id}/comments`, { query: { includeResolved: true } }),
        ]);
        if (generation !== loadGeneration) return;

        const presence: Record<string, PresenceEntry> = {};
        for (const member of joinResult.members) {
          const info = room.members.find((m) => m.user.id === member.userId);
          presence[member.userId] = {
            userId: member.userId,
            displayName: member.displayName || info?.user.displayName || "Guest",
            color: member.color || info?.user.color || "#2563EB",
            avatarUrl: info?.user.avatarUrl,
            cursorX: member.cursorX,
            cursorY: member.cursorY,
          };
        }
        presence[joinResult.you.userId] = {
          userId: joinResult.you.userId,
          displayName: joinResult.you.displayName,
          color: joinResult.you.color,
          avatarUrl: room.members.find((m) => m.user.id === joinResult.you.userId)?.user.avatarUrl,
        };

        set({
          status: "ready",
          error: null,
          roomId,
          roomName: room.name,
          role: room.role,
          canEdit: room.role === "Owner" || room.role === "Editor",
          designs: room.designs,
          ...designStatePatch(design),
          tool: "select",
          zoom: 1,
          panX: 0,
          panY: 0,
          members: room.members,
          presence,
          cursors: {},
          remoteSelections: {},
          comments,
        });
      } catch (err) {
        if (generation !== loadGeneration) return;
        const message =
          err instanceof ApiError
            ? err.status === 403
              ? "You don't have access to this room."
              : err.status === 404
                ? "Room not found."
                : err.message
            : "Could not open this room.";
        set({ status: "error", error: message });
      }
    },

    async resync() {
      const { designId } = get();
      if (!designId) return;
      try {
        const design = await api.get<DesignDto>(`/designs/${designId}`);
        set((s) => ({
          elements: [...design.elements].sort(byZ),
          selection: s.selection.filter((id) => design.elements.some((e) => e.id === id)),
        }));
      } catch {
        /* transient network issue — keep local state */
      }
    },

    async handleRejoin() {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
        saveTimer = null;
      }
      await flushPatches();
      await get().resync();
      if (get().canEdit) get().markDirty();
      await get().loadComments();
    },

    async loadDesign(nextDesignId) {
      const current = get();
      if (!current.roomId || current.designId === nextDesignId) return;
      if (current.saveStatus === "unsaved" || current.saveStatus === "saving") {
        await get().flushSave({ silent: true });
      }
      const generation = ++loadGeneration;
      const roomId = get().roomId;
      await salvageDesignEdits();
      if (generation !== loadGeneration) return;

      set({ status: "loading", error: null });
      try {
        const design = await api.get<DesignDto>(`/rooms/${roomId}/design`, {
          query: { designId: nextDesignId },
        });
        if (generation !== loadGeneration) return;
        const comments = await api.get<CommentDto[]>(`/designs/${design.id}/comments`, {
          query: { includeResolved: true },
        });
        if (generation !== loadGeneration) return;
        set({
          status: "ready",
          error: null,
          ...designStatePatch(design),
          tool: "select",
          zoom: 1,
          panX: 0,
          panY: 0,
          comments,
        });
      } catch (err) {
        if (generation !== loadGeneration) return;
        set({ status: "ready", error: null });
        toast.error(err instanceof ApiError ? err.message : "Could not open that page");
      }
    },

    applyDesign(design) {
      set({ ...designStatePatch(design) });
    },

    setDesigns(designs) {
      set({ designs });
    },

    async createRevision(label) {
      const state = get();
      if (!state.designId || !state.canEdit) return;
      if (state.saveStatus === "unsaved" || state.saveStatus === "saving") {
        await get().flushSave();
      }
      const designId = get().designId;
      if (!designId) return;
      const result = await api.post<CreateRevisionResult>(`/designs/${designId}/revisions`, {
        label: label ? label : null,
      });
      if (!result.created) toast.info("Versions are captured automatically about once a minute");
    },

    async restoreRevision(revisionId) {
      const state = get();
      if (!state.canEdit || !state.designId) return;
      if (state.saveStatus === "unsaved" || state.saveStatus === "saving") {
        await get().flushSave();
      }
      await flushPatches();
      if (patchTimer !== null) {
        window.clearTimeout(patchTimer);
        patchTimer = null;
      }
      pendingPatches.clear();
      const designId = get().designId;
      if (!designId) return;
      const design = await api.post<DesignDto>(`/designs/${designId}/revisions/${revisionId}/restore`);
      pendingPatches.clear();
      set(designStatePatch(design));
      notify("DesignSaved", get().roomId, design.id);
    },

    async leave() {
      loadGeneration += 1;
      clearTimers();
      pendingPatches.clear();
      pendingRemoteUpdates.clear();
      const state = get();
      if (state.saveStatus === "unsaved" || state.saveStatus === "saving") {
        await get().flushSave({ silent: true });
      }
      await flushPatches();
      await leaveRoom();
      set({
        status: "idle",
        roomId: null,
        designId: null,
        designs: [],
        elements: [],
        selection: [],
        comments: [],
        presence: {},
        cursors: {},
        remoteSelections: {},
        members: [],
        past: [],
        future: [],
        contextMenu: null,
        editingTextId: null,
        draft: null,
        marquee: null,
        presentOpen: false,
      });
    },

    setTool(tool) {
      set({ tool, contextMenu: null });
      if (tool !== "select") set({ editingTextId: null });
    },

    setViewport(patch) {
      set((s) => ({
        zoom: clamp(patch.zoom ?? s.zoom, 0.05, 8),
        panX: patch.panX ?? s.panX,
        panY: patch.panY ?? s.panY,
      }));
    },

    toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
    setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    setPresentOpen: (open) => set({ presentOpen: open }),
    setRightTab: (tab) => set({ rightTab: tab, contextMenu: null }),
    setContextMenu: (menu) => set({ contextMenu: menu }),
    setEditingText: (id) => set({ editingTextId: id }),
    setDraft: (draft) => set({ draft }),
    setMarquee: (marquee) => set({ marquee }),

    select(ids) {
      const unique = Array.from(new Set(ids));
      const current = get().selection;
      const nextTab = unique.length > 0 && get().rightTab === "history" ? "design" : undefined;
      if (unique.length === current.length && unique.every((id, i) => current[i] === id)) {
        if (nextTab) set({ rightTab: nextTab });
        return;
      }
      set({ selection: unique, ...(nextTab ? { rightTab: nextTab } : {}) });
      get().scheduleSelection();
    },

    toggleSelect(id) {
      const current = get().selection;
      const nextTab = get().rightTab === "history" ? "design" : undefined;
      set({
        selection: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
        ...(nextTab ? { rightTab: nextTab } : {}),
      });
      get().scheduleSelection();
    },

    clearSelection() {
      if (get().selection.length === 0) return;
      set({ selection: [] });
      get().scheduleSelection();
    },

    selectAll() {
      const visible = get().elements.filter((e) => e.isVisible).map((e) => e.id);
      set({ selection: visible, ...(get().rightTab === "history" ? { rightTab: "design" } : {}) });
      get().scheduleSelection();
    },

    pushHistory() {
      set((s) => ({
        past: [...s.past.slice(-59), clone(s.elements)],
        future: [],
      }));
    },

    undo() {
      const state = get();
      if (state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      const futureSnapshot = clone(state.elements);
      const restored = clone(previous);
      set({
        elements: restored,
        past: state.past.slice(0, -1),
        future: [...state.future, futureSnapshot],
        selection: state.selection.filter((id) => restored.some((e) => e.id === id)),
      });
      broadcastDiff(state.elements, restored);
      markDirty();
      // the debounced snapshot takes 30s now — persist the revert immediately;
      // wait for in-flight patches so the PUT is the final word.
      void patchQueue.then(() => {
        if (patchTimer !== null) {
          window.clearTimeout(patchTimer);
          patchTimer = null;
        }
        pendingPatches.clear();
        return get().flushSave();
      });
    },

    redo() {
      const state = get();
      if (state.future.length === 0) return;
      const next = state.future[state.future.length - 1];
      const pastSnapshot = clone(state.elements);
      const restored = clone(next);
      set({
        elements: restored,
        future: state.future.slice(0, -1),
        past: [...state.past, pastSnapshot],
        selection: state.selection.filter((id) => restored.some((e) => e.id === id)),
      });
      broadcastDiff(state.elements, restored);
      markDirty();
      void patchQueue.then(() => {
        if (patchTimer !== null) {
          window.clearTimeout(patchTimer);
          patchTimer = null;
        }
        pendingPatches.clear();
        return get().flushSave();
      });
    },

    async addElement(input) {
      const state = get();
      if (!requireEditor() || !state.designId || !state.roomId) return null;
      try {
        const element = await api.post<DesignElementDto>(`/designs/${state.designId}/elements`, {
          ...input,
          fill: input.fill !== undefined ? input.fill : DEFAULT_FILL[input.type],
        });
        get().pushHistory();
        set((s) => ({
          elements: [...s.elements, element].sort(byZ),
          selection: [element.id],
        }));
        notify("ElementCreated", state.roomId, state.designId, element);
        get().scheduleSelection();
        markDirty();
        return element;
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not create the element");
        return null;
      }
    },

    updateElement(id, patch, opts) {
      if (!get().canEdit) return;
      set((s) => ({
        elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)),
      }));
      if (opts?.immediate) {
        schedulePatch(id, patch);
        void flushPatches();
      } else {
        schedulePatch(id, patch);
      }
      markDirty();
    },

    previewPositions(positions) {
      if (positions.length === 0) return;
      const map = new Map(positions.map((p) => [p.id, p]));
      set((s) => ({
        elements: s.elements.map((e) => {
          const next = map.get(e.id);
          return next ? { ...e, x: next.x, y: next.y } : e;
        }),
      }));
    },

    commitMove(ids) {
      const snapshot = new Set(ids);
      const state = get();
      for (const id of snapshot) {
        const element = state.elements.find((e) => e.id === id);
        if (!element) continue;
        schedulePatch(id, { x: element.x, y: element.y });
        notify("ElementUpdated", state.roomId!, state.designId!, id, { x: element.x, y: element.y });
      }
      void flushPatches();
      markDirty();
    },

    async deleteElements(ids) {
      if (ids.length === 0 || !requireEditor()) return;
      const state = get();
      if (!state.designId || !state.roomId) return;
      get().pushHistory();
      try {
        await api.post(`/designs/${state.designId}/elements/bulk-delete`, { ids });
        set((s) => ({
          elements: s.elements.filter((e) => !ids.includes(e.id)),
          selection: s.selection.filter((id) => !ids.includes(id)),
        }));
        notify("ElementsDeleted", state.roomId, state.designId, ids);
        get().scheduleSelection();
        markDirty();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not delete");
      }
    },

    async deleteSelected() {
      await get().deleteElements([...get().selection]);
    },

    async duplicateSelected() {
      const state = get();
      if (state.selection.length === 0 || !requireEditor() || !state.designId || !state.roomId) return;
      const selected = state.elements.filter((e) => state.selection.includes(e.id));
      const created: DesignElementDto[] = [];
      for (const element of selected) {
        const { id: _id, updatedAt: _u, ...rest } = element;
        const copy = await api.post<DesignElementDto>(`/designs/${state.designId}/elements`, {
          ...rest,
          name: `${element.name} copy`,
          x: element.x + 16,
          y: element.y + 16,
        });
        created.push(copy);
        notify("ElementCreated", state.roomId, state.designId, copy);
      }
      if (created.length > 0) {
        get().pushHistory();
        set((s) => ({
          elements: [...s.elements, ...created].sort(byZ),
          selection: created.map((c) => c.id),
        }));
        markDirty();
      }
    },

    copySelected() {
      const state = get();
      clipboard = clone(state.elements.filter((e) => state.selection.includes(e.id)));
      if (clipboard.length > 0) toast.success(`${clipboard.length} copied`);
    },

    async pasteClipboard() {
      const state = get();
      if (clipboard.length === 0 || !requireEditor() || !state.designId || !state.roomId) return;
      const created: DesignElementDto[] = [];
      for (const element of clipboard) {
        const { id: _id, updatedAt: _u, ...rest } = element;
        const copy = await api.post<DesignElementDto>(`/designs/${state.designId}/elements`, {
          ...rest,
          x: element.x + 24,
          y: element.y + 24,
        });
        created.push(copy);
        notify("ElementCreated", state.roomId, state.designId, copy);
      }
      if (created.length > 0) {
        get().pushHistory();
        set((s) => ({
          elements: [...s.elements, ...created].sort(byZ),
          selection: created.map((c) => c.id),
        }));
        clipboard = clone(created.map((c) => ({ ...c, x: c.x - 24, y: c.y - 24 })));
        markDirty();
      }
    },

    async reorder(orderedIds) {
      const state = get();
      if (!requireEditor() || !state.designId || !state.roomId) return;
      try {
        await api.put(`/designs/${state.designId}/elements/order`, { ids: orderedIds });
        get().pushHistory();
        set((s) => {
          const map = new Map(s.elements.map((e) => [e.id, e]));
          const next = orderedIds
            .map((id, index) => {
              const element = map.get(id);
              return element ? { ...element, zIndex: index } : null;
            })
            .filter(Boolean) as DesignElementDto[];
          return { elements: next };
        });
        notify("ElementsReordered", state.roomId, state.designId, orderedIds);
        markDirty();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reorder layers");
      }
    },

    async bringToFront() {
      const state = get();
      if (state.selection.length === 0) return;
      const rest = state.elements.filter((e) => !state.selection.includes(e.id)).map((e) => e.id);
      await get().reorder([...rest, ...state.selection]);
    },

    async sendToBack() {
      const state = get();
      if (state.selection.length === 0) return;
      const rest = state.elements.filter((e) => !state.selection.includes(e.id)).map((e) => e.id);
      await get().reorder([...state.selection, ...rest]);
    },

    markDirty,

    async flushSave(opts) {
      const state = get();
      if (!state.canEdit || !state.designId) return;
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
        saveTimer = null;
      }
      const seq = ++saveSeq;
      set({ saveStatus: "saving" });
      try {
        await api.put(`/designs/${state.designId}`, {
          elements: state.elements,
          width: state.designWidth,
          height: state.designHeight,
          backgroundColor: state.designBackground,
        });
        notify("DesignSaved", state.roomId, state.designId);
        captureRevision(state.designId);
        if (seq === saveSeq) set({ saveStatus: "saved", lastSavedAt: new Date().toISOString() });
      } catch (err) {
        if (seq === saveSeq) set({ saveStatus: "error" });
        if (!opts?.silent) {
          toast.error(err instanceof ApiError ? err.message : "Autosave failed — check your connection");
        }
      }
    },

    async flushBatch() {
      if (patchTimer !== null) {
        window.clearTimeout(patchTimer);
        patchTimer = null;
      }
      await flushPatches();
      await get().flushSave();
    },

    scheduleCursor(x, y) {
      const state = get();
      if (!state.roomId) return;
      const now = Date.now();
      if (now - lastCursorSent < 50) return;
      lastCursorSent = now;
      notify("CursorMoved", state.roomId, x, y);
    },

    scheduleSelection() {
      const state = get();
      if (!state.roomId) return;
      const now = Date.now();
      if (now - lastSelectionSent < 120) return;
      lastSelectionSent = now;
      notify("SelectionChanged", state.roomId, state.selection);
    },

    async loadComments() {
      const state = get();
      if (!state.designId) return;
      try {
        const comments = await api.get<CommentDto[]>(`/designs/${state.designId}/comments`, {
          query: { includeResolved: true },
        });
        set({ comments });
      } catch {
        /* keep previous comments */
      }
    },

    async createComment(input) {
      const state = get();
      if (!state.designId || !state.roomId) return;
      try {
        const comment = await api.post<CommentDto>(`/designs/${state.designId}/comments`, {
          body: input.body,
          x: input.x,
          y: input.y,
          parentId: input.parentId ?? null,
        });
        set((s) => {
          if (!comment.parentId) return { comments: [...s.comments, comment], pendingComment: null };
          return {
            comments: s.comments.map((c) =>
              c.id === comment.parentId ? { ...c, replies: [...c.replies, comment] } : c,
            ),
            pendingComment: null,
          };
        });
        notify("CommentsChanged", state.roomId, state.designId);
        toast.success("Comment added");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not add comment");
      }
    },

    async updateComment(id, body) {
      const state = get();
      if (!state.roomId || !state.designId) return;
      try {
        const updated = await api.put<CommentDto>(`/comments/${id}`, { body });
        set((s) => ({
          comments: s.comments.map((c) => {
            if (c.id === updated.id) return { ...updated, replies: c.replies };
            if (c.replies.some((r) => r.id === updated.id)) {
              return { ...c, replies: c.replies.map((r) => (r.id === updated.id ? updated : r)) };
            }
            return c;
          }),
        }));
        notify("CommentsChanged", state.roomId, state.designId);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not edit comment");
      }
    },

    async resolveComment(id, resolved) {
      const state = get();
      if (!state.roomId || !state.designId) return;
      const previous = state.comments;
      set((s) => ({
        comments: s.comments.map((c) => (c.id === id ? { ...c, resolved } : c)),
        activeCommentId: s.activeCommentId === id && resolved ? null : s.activeCommentId,
      }));
      try {
        await api.post(`/comments/${id}/resolve`, { resolved });
        notify("CommentsChanged", state.roomId, state.designId);
        toast.success(resolved ? "Comment resolved" : "Comment reopened");
      } catch (err) {
        set({ comments: previous });
        toast.error(err instanceof ApiError ? err.message : "Could not update comment");
      }
    },

    async deleteComment(id) {
      const state = get();
      if (!state.roomId || !state.designId) return;
      try {
        await api.delete(`/comments/${id}`);
        set((s) => ({
          comments: s.comments
            .filter((c) => c.id !== id)
            .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
          activeCommentId: s.activeCommentId === id ? null : s.activeCommentId,
        }));
        notify("CommentsChanged", state.roomId, state.designId);
        toast.success("Comment deleted");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not delete comment");
      }
    },

    setActiveComment: (id) => set({ activeCommentId: id, rightTab: "comments" }),
    setPendingComment: (point) => set({ pendingComment: point, rightTab: "comments", tool: "select" }),

    memberJoined(payload) {
      set((s) => ({
        presence: {
          ...s.presence,
          [payload.userId]: {
            userId: payload.userId,
            displayName: payload.displayName,
            color: payload.color,
            avatarUrl: s.members.find((m) => m.user.id === payload.userId)?.user.avatarUrl,
          },
        },
      }));
      toast.success(`${payload.displayName} joined the room`);
    },

    memberLeft(payload) {
      set((s) => {
        const presence = { ...s.presence };
        const cursors = { ...s.cursors };
        const remoteSelections = { ...s.remoteSelections };
        delete presence[payload.userId];
        delete cursors[payload.userId];
        delete remoteSelections[payload.userId];
        return { presence, cursors, remoteSelections };
      });
    },

    remoteCursor(payload) {
      const identity = identityFor(payload.userId);
      set((s) => ({
        cursors: {
          ...s.cursors,
          [payload.userId]: {
            displayName: identity.displayName,
            color: identity.color,
            x: payload.x,
            y: payload.y,
            updatedAt: Date.now(),
          },
        },
      }));
    },

    remoteSelection(payload) {
      if (payload.elementIds.length === 0) {
        set((s) => {
          const next = { ...s.remoteSelections };
          delete next[payload.userId];
          return { remoteSelections: next };
        });
        return;
      }
      const identity = identityFor(payload.userId);
      set((s) => ({
        remoteSelections: {
          ...s.remoteSelections,
          [payload.userId]: {
            displayName: identity.displayName,
            color: identity.color,
            ids: payload.elementIds,
          },
        },
      }));
    },

    remoteCreated(element) {
      set((s) => {
        if (s.elements.some((e) => e.id === element.id)) return s;
        return { elements: [...s.elements, element].sort(byZ) };
      });
    },

    remoteUpdated(payload) {
      if (pendingPatches.has(payload.elementId)) {
        // a local patch is still pending for this element — queue the remote
        // update and apply it once the local flush settles (H3).
        pendingRemoteUpdates.set(payload.elementId, payload);
        return;
      }
      set((s) => ({
        elements: s.elements.map((e) => (e.id === payload.elementId ? { ...e, ...payload.patch } : e)),
      }));
    },

    remoteDeleted(ids) {
      for (const id of ids) pendingRemoteUpdates.delete(id);
      set((s) => ({
        elements: s.elements.filter((e) => !ids.includes(e.id)),
        selection: s.selection.filter((id) => !ids.includes(id)),
      }));
    },

    remoteReordered(ids) {
      set((s) => {
        const map = new Map(s.elements.map((e) => [e.id, e]));
        const reordered = ids
          .map((id, index) => {
            const element = map.get(id);
            return element ? { ...element, zIndex: index } : null;
          })
          .filter(Boolean) as DesignElementDto[];
        const missing = s.elements.filter((e) => !ids.includes(e.id));
        return { elements: [...reordered, ...missing].sort(byZ) };
      });
    },

    applyJoinResult(result) {
      set((s) => {
        const presence = { ...s.presence };
        for (const member of result.members) {
          presence[member.userId] = {
            userId: member.userId,
            displayName: member.displayName,
            color: member.color,
            avatarUrl: s.members.find((m) => m.user.id === member.userId)?.user.avatarUrl,
            cursorX: member.cursorX,
            cursorY: member.cursorY,
          };
        }
        presence[result.you.userId] = {
          userId: result.you.userId,
          displayName: result.you.displayName,
          color: result.you.color,
          avatarUrl: s.members.find((m) => m.user.id === result.you.userId)?.user.avatarUrl,
        };
        return { presence };
      });
    },

    async renameRoom(name) {
      const state = get();
      if (!state.roomId) return;
      const updated = await api.put<RoomSummary>(`/rooms/${state.roomId}`, { name });
      set({ roomName: updated.name });
    },
  };
});

function elementToPatch(element: DesignElementDto): UpdateElementPayload {
  return {
    name: element.name,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    cornerRadius: element.cornerRadius,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    src: element.src,
    points: element.points,
    zIndex: element.zIndex,
    isVisible: element.isVisible,
    isLocked: element.isLocked,
    parentId: element.parentId,
    linkToDesignId: element.linkToDesignId,
  };
}

export function getSelectedElements(state: EditorState): DesignElementDto[] {
  return state.elements.filter((e) => state.selection.includes(e.id));
}

export function createId(): string {
  return uid();
}

export function isPagedRooms(value: unknown): value is PagedResult<RoomSummary> {
  return typeof value === "object" && value !== null && "items" in value;
}
