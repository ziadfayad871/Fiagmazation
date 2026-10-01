"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { RoomMenu } from "./RoomMenu";
import { colorForKey, cn } from "@/lib/utils";
import type { RoomSummary } from "@/lib/types";

function Thumb({ room, className }: { room: RoomSummary; className?: string }) {
  const accent = room.accentColor || colorForKey(room.id);
  return (
    <span
      className={cn("relative block overflow-hidden rounded-md", className)}
      style={{ backgroundColor: accent }}
      aria-hidden
    >
      <span className="absolute left-2 top-2 h-4 w-6 rounded-[3px] bg-card/85" />
      <span className="absolute bottom-2 right-2 size-4 rounded-full bg-card/70" />
      <span className="absolute bottom-2 left-2 h-3 w-3 rounded-[2px] bg-card/50" />
    </span>
  );
}

export function RoomItem({
  room,
  variant = "row",
  onChanged,
  onDeleted,
  onShare,
}: {
  room: RoomSummary;
  variant?: "row" | "card";
  onChanged: (room: RoomSummary) => void;
  onDeleted: (roomId: string) => void;
  onShare?: () => void;
}) {
  const router = useRouter();
  const openRoom = () => router.push(`/editor?room=${room.id}`);
  const others = Math.max(0, room.memberCount - 1);

  if (variant === "card") {
    return (
      <article
        className="group cursor-pointer overflow-hidden rounded-lg border border-line bg-card transition-shadow hover:shadow-[0_10px_28px_-16px_rgba(16,24,40,0.35)]"
        onClick={openRoom}
      >
        <div className="relative h-28">
          <Thumb room={room} className="h-full w-full rounded-none" />
          <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
            <RoomMenu room={room} onChanged={onChanged} onDeleted={onDeleted} onShare={onShare} />
          </div>
          <span className="absolute bottom-2 left-3 flex items-center gap-1.5 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
            <Globe className="size-3 text-ink-400" />
            {room.designCount} {room.designCount === 1 ? "design" : "designs"}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink-900">{room.name}</h3>
              <p className="mt-0.5 text-xs text-ink-400">Last edited {room.relativeUpdatedAt}</p>
            </div>
            {room.onlineCount > 0 ? (
              <Badge tone="green" dot>
                {room.onlineCount} online
              </Badge>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                name={room.owner.displayName}
                src={room.owner.avatarUrl}
                color={room.owner.color}
                size="xs"
              />
              {others > 0 ? (
                <span className="text-[11px] font-medium text-ink-400">+{others} collaborators</span>
              ) : (
                <span className="text-[11px] font-medium text-ink-400">Just you</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
              Open
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5 transition-colors hover:border-ink-400/50"
      onClick={openRoom}
    >
      <Thumb room={room} className="size-10 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{room.name}</p>
        <p className="truncate text-xs text-ink-400">Last edited {room.relativeUpdatedAt}</p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <AvatarStack
          people={[
            { id: room.owner.id, displayName: room.owner.displayName, avatarUrl: room.owner.avatarUrl, color: room.owner.color },
          ]}
          max={1}
          size="xs"
        />
        {others > 0 ? (
          <span className="-ml-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-line px-1 text-[10px] font-bold text-ink-600">
            +{others}
          </span>
        ) : null}
      </div>

      {room.onlineCount > 0 ? (
        <Badge tone="green" dot className="shrink-0">
          {room.onlineCount} online
        </Badge>
      ) : (
        <Badge tone="gray" className="hidden shrink-0 sm:inline-flex">
          {room.role}
        </Badge>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openRoom();
        }}
        className="h-8 shrink-0 rounded-md border border-line bg-card px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-surface"
      >
        Open
      </button>

      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <RoomMenu room={room} onChanged={onChanged} onDeleted={onDeleted} onShare={onShare} />
      </div>
    </div>
  );
}
