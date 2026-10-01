"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FolderOpen, Plus, Sparkles, UserSquare2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoomItem } from "@/components/dashboard/RoomItem";
import { CreateRoomModal } from "@/components/dashboard/CreateRoomModal";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { greeting } from "@/lib/utils";
import type { PagedResult, RoomStats, RoomSummary } from "@/lib/types";

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-line bg-card px-4 py-3.5">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-[13px] text-ink-500">{label}</p>
        <p className="font-display text-2xl font-extrabold leading-tight text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function CreateRoomCard({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-card p-5 text-center">
      <div className="relative mx-auto flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-surface">
        <span className="absolute left-6 top-6 size-10 rotate-12 rounded-lg bg-flame-500/90" />
        <span className="absolute bottom-5 right-7 size-8 rounded-full bg-grape-500/90" />
        <span className="absolute right-12 top-8 h-5 w-9 -rotate-6 rounded-sm bg-[#FF8FA3]" />
        <span className="absolute bottom-8 left-10 h-4 w-8 rounded-sm bg-brand-600/80" />
        <span className="relative flex size-14 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-[0_8px_20px_-6px_rgba(59,91,254,0.9)]">
          <Plus className="size-6" />
        </span>
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold text-ink-900">Create New Room</h3>
      <p className="mt-1 text-sm text-ink-500">
        Start a new design room and invite your team to collaborate.
      </p>
      <Button className="mt-4" block onClick={onCreate} icon={<Plus className="size-4" />}>
        Create Room
      </Button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
      <div className="size-10 animate-pulse rounded-md bg-line-soft" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-44 animate-pulse rounded bg-line-soft" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-line-soft" />
      </div>
    </div>
  );
}

function DashboardHome() {
  const user = useAuth((s) => s.user);
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [creating, setCreating] = useState(false);

  const stats = useAsync<RoomStats>(() => api.get("/rooms/stats"), []);
  const recent = useAsync<PagedResult<RoomSummary>>(
    () => api.get("/rooms", { query: { scope: "recent", search: q || undefined, pageSize: 8 } }),
    [q],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">
          {greeting()}, {user?.firstName ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening with your design rooms.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Rooms" value={stats.data?.myRooms ?? 0} icon={FolderOpen} tone="bg-brand-50 text-brand-600" />
        <StatCard label="Shared Rooms" value={stats.data?.sharedRooms ?? 0} icon={Users} tone="bg-violet-50 text-grape-500" />
        <StatCard
          label="Total Collaborators"
          value={stats.data?.totalCollaborators ?? 0}
          icon={UserSquare2}
          tone="bg-emerald-50 text-live"
        />
      </div>

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-ink-900">Recent Rooms</h2>
            <Link href="/dashboard/rooms" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
              View all
            </Link>
          </div>

          {recent.loading && !recent.data ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : recent.error ? (
            <EmptyState
              icon={Sparkles}
              title="Could not load recent rooms"
              description={recent.error}
              action={
                <Button variant="secondary" onClick={recent.reload}>
                  Try again
                </Button>
              }
            />
          ) : (recent.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={q ? `No rooms match “${q}”` : "No rooms yet"}
              description={
                q ? "Try a different search term." : "Create your first room and invite your team to design together."
              }
              action={
                !q ? (
                  <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
                    Create Room
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {recent.data?.items.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  variant="row"
                  onDeleted={recent.reload}
                  onChanged={recent.reload}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-6">
          <CreateRoomCard onCreate={() => setCreating(true)} />
          <div className="mt-4 rounded-lg border border-line bg-card p-4">
            <p className="text-[13px] font-bold text-ink-900">Rooms overview</p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: "Owned by me", value: stats.data?.myRooms ?? 0, color: "#3B5BFE" },
                { label: "Shared with me", value: stats.data?.sharedRooms ?? 0, color: "#7C5CFC" },
                { label: "Online right now", value: stats.data?.onlineNow ?? 0, color: "#12B76A" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5 text-sm">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="flex-1 text-ink-600">{row.label}</span>
                  <span className="font-bold text-ink-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <CreateRoomModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardHome />
    </Suspense>
  );
}
