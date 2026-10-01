"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FolderOpen, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { RoomItem } from "./RoomItem";
import { CreateRoomModal } from "./CreateRoomModal";
import { ShareRoomModal } from "./ShareRoomModal";
import type { PagedResult, RoomSummary } from "@/lib/types";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
      <div className="size-10 animate-pulse rounded-md bg-line-soft" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-40 animate-pulse rounded bg-line-soft" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-line-soft" />
      </div>
      <div className="h-6 w-16 animate-pulse rounded-full bg-line-soft" />
      <div className="h-8 w-14 animate-pulse rounded-md bg-line-soft" />
    </div>
  );
}

export function RoomsView({
  scope,
  title,
  subtitle,
  variant = "row",
  showCreate = true,
  emptyTitle,
  emptyDescription,
}: {
  scope: "all" | "mine" | "shared" | "recent";
  title?: string;
  subtitle?: string;
  variant?: "row" | "card";
  showCreate?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, loading, error, reload } = useAsync<PagedResult<RoomSummary>>(
    () => api.get("/rooms", { query: { scope, search: q || undefined, pageSize: 100 } }),
    [scope, q],
  );

  const [items, setItems] = useState<RoomSummary[]>([]);
  const [creating, setCreating] = useState(false);
  const [shareTarget, setShareTarget] = useState<RoomSummary | null>(null);

  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {title ? <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
        </div>
        {showCreate ? (
          <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
            Create Room
          </Button>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={FolderOpen}
          title="Could not load your rooms"
          description={error}
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={scope === "shared" ? Users : FolderOpen}
          title={
            q
              ? `No rooms match “${q}”`
              : emptyTitle ?? (scope === "shared" ? "Nothing shared with you yet" : "No rooms yet")
          }
          description={
            q
              ? "Try a different search term."
              : emptyDescription ??
                (scope === "shared"
                  ? "When someone invites you to a room, it shows up here."
                  : "Create your first design room and start collaborating.")
          }
          action={
            showCreate && !q ? (
              <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
                Create Room
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={variant === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {items.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              variant={variant}
              onShare={() => setShareTarget(room)}
              onChanged={(updated) =>
                setItems((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
              }
              onDeleted={(id) => setItems((prev) => prev.filter((r) => r.id !== id))}
            />
          ))}
        </div>
      )}

      <CreateRoomModal open={creating} onClose={() => setCreating(false)} />
      {shareTarget ? (
        <ShareRoomModal
          open
          roomId={shareTarget.id}
          roomName={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      ) : null}
    </div>
  );
}
