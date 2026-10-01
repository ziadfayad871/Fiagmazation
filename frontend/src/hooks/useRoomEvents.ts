"use client";

import { useEffect } from "react";
import { onHub, type JoinResult } from "@/lib/roomSocket";
import { useEditor } from "@/store/editor";
import type { DesignElementDto, UpdateElementPayload } from "@/lib/types";

interface CreatedPayload {
  designId?: string;
  element: DesignElementDto;
}
interface UpdatedPayload {
  designId?: string;
  elementId: string;
  patch: UpdateElementPayload;
}
interface DeletedPayload {
  designId?: string;
  elementIds: string[];
}
interface ReorderedPayload {
  designId?: string;
  elementIds: string[];
}
interface CursorPayload {
  userId: string;
  x: number;
  y: number;
}
interface SelectionPayload {
  userId: string;
  elementIds: string[];
}
interface MemberPayload {
  userId: string;
  displayName: string;
  color: string;
  selection?: string[];
}

export function useRoomEvents(): void {
  useEffect(() => {
    let commentTimer: number | null = null;
    const reloadComments = () => {
      if (commentTimer !== null) window.clearTimeout(commentTimer);
      commentTimer = window.setTimeout(() => {
        commentTimer = null;
        void useEditor.getState().loadComments();
      }, 250);
    };

    const forCurrentDesign = (payload: { designId?: string } | null | undefined) =>
      !payload?.designId || payload.designId === useEditor.getState().designId;

    const offs = [
      onHub("PresenceJoined", (payload) => {
        const p = payload as MemberPayload;
        if (!p?.userId || p.userId === useEditor.getState().selfUserId) return;
        useEditor.getState().memberJoined(p);
      }),
      onHub("PresenceLeft", (payload) => {
        const p = payload as { userId?: string };
        if (!p?.userId || p.userId === useEditor.getState().selfUserId) return;
        useEditor.getState().memberLeft({ userId: p.userId });
      }),
      onHub("CursorMoved", (payload) => {
        const p = payload as CursorPayload;
        if (!p?.userId || p.userId === useEditor.getState().selfUserId) return;
        useEditor.getState().remoteCursor(p);
      }),
      onHub("SelectionChanged", (payload) => {
        const p = payload as SelectionPayload;
        if (!p?.userId || p.userId === useEditor.getState().selfUserId) return;
        useEditor.getState().remoteSelection(p);
      }),
      onHub("ElementCreated", (payload) => {
        const p = payload as CreatedPayload;
        if (p?.element && forCurrentDesign(p)) useEditor.getState().remoteCreated(p.element);
      }),
      onHub("ElementUpdated", (payload) => {
        const p = payload as UpdatedPayload;
        if (p?.elementId && p.patch && forCurrentDesign(p)) useEditor.getState().remoteUpdated(p);
      }),
      onHub("ElementsDeleted", (payload) => {
        const p = payload as DeletedPayload;
        if (p?.elementIds?.length && forCurrentDesign(p)) useEditor.getState().remoteDeleted(p.elementIds);
      }),
      onHub("ElementsReordered", (payload) => {
        const p = payload as ReorderedPayload;
        if (p?.elementIds?.length && forCurrentDesign(p)) useEditor.getState().remoteReordered(p.elementIds);
      }),
      onHub("CommentsChanged", (payload) => {
        if (forCurrentDesign(payload as { designId?: string })) reloadComments();
      }),
      onHub("DesignSaved", () => {
        /* receivers keep their own autosave cycle — nothing to do */
      }),
      onHub("Rejoined", (payload) => {
        const state = useEditor.getState();
        state.applyJoinResult(payload as JoinResult);
        void state.handleRejoin();
      }),
    ];

    return () => {
      for (const off of offs) off();
      if (commentTimer !== null) window.clearTimeout(commentTimer);
    };
  }, []);
}
