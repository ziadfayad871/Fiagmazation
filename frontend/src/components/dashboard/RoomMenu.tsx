"use client";

import { useState } from "react";
import { Copy, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { toast } from "@/store/toast";
import type { RoomSummary } from "@/lib/types";

export function RoomMenu({
  room,
  onChanged,
  onDeleted,
  onShare,
  align = "right",
}: {
  room: RoomSummary;
  onChanged: (room: RoomSummary) => void;
  onDeleted: (roomId: string) => void;
  onShare?: () => void;
  align?: "left" | "right";
}) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    if (busy) return;
    setBusy(true);
    try {
      const copy = await api.post<RoomSummary>(`/rooms/${room.id}/duplicate`);
      toast.success(`Duplicated as “${copy.name}”`);
      onChanged(copy);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not duplicate this room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Menu
        align={align}
        trigger={
          <button
            type="button"
            aria-label="Room actions"
            className="flex size-8 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-line-soft hover:text-ink-700"
          >
            <MoreHorizontal className="size-4.5" />
          </button>
        }
      >
        {(close) => (
          <>
            <MenuItem
              icon={<Pencil className="size-4" />}
              onClick={() => {
                close();
                setRenaming(true);
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<Copy className="size-4" />}
              disabled={busy}
              onClick={() => {
                close();
                void duplicate();
              }}
            >
              Duplicate
            </MenuItem>
            {onShare ? (
              <MenuItem
                icon={<Share2 className="size-4" />}
                onClick={() => {
                  close();
                  onShare();
                }}
              >
                Share
              </MenuItem>
            ) : null}
            <MenuSeparator />
            <MenuItem
              danger
              icon={<Trash2 className="size-4" />}
              onClick={() => {
                close();
                setDeleting(true);
              }}
            >
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      <PromptDialog
        open={renaming}
        title="Rename room"
        label="Room name"
        initialValue={room.name}
        onClose={() => setRenaming(false)}
        onSubmit={async (name) => {
          const updated = await api.put<RoomSummary>(`/rooms/${room.id}`, { name });
          onChanged(updated);
          toast.success("Room renamed");
        }}
      />

      <ConfirmDialog
        open={deleting}
        title={`Delete “${room.name}”?`}
        description="Rooms, designs and comments inside it are removed permanently."
        confirmLabel="Delete room"
        onClose={() => setDeleting(false)}
        onConfirm={async () => {
          await api.delete(`/rooms/${room.id}`);
          onDeleted(room.id);
          toast.success("Room deleted");
        }}
      />
    </>
  );
}
