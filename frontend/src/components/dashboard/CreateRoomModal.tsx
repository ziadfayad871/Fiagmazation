"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import type { RoomSummary } from "@/lib/types";

const accents = ["#3B5BFE", "#F5741F", "#7C5CFC", "#EF4444", "#12B76A", "#EC4899"];

export function CreateRoomModal({
  open,
  onClose,
  onCreated,
  openInEditor = true,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (room: RoomSummary) => void;
  openInEditor?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(accents[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setAccent(accents[Math.floor(Math.random() * accents.length)]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your room a name");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const room = await api.post<RoomSummary>("/rooms", {
        name: name.trim(),
        accentColor: accent,
      });
      toast.success(`Room “${room.name}” created`);
      onClose();
      onCreated?.(room);
      if (openInEditor) router.push(`/editor?room=${room.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create room" description="Give your room a name" size="sm">
      <form onSubmit={submit}>
        <Input
          autoFocus
          placeholder="Project name..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          invalid={Boolean(error)}
          maxLength={120}
        />
        {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}

        <div className="mt-4">
          <p className="mb-2 text-[13px] font-semibold text-ink-700">Accent color</p>
          <div className="flex gap-2">
            {accents.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                onClick={() => setAccent(c)}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform",
                  accent === c ? "scale-110 border-ink-900" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
