"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Mail, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { InlineLoader } from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import type { RoomMember, RoomRole } from "@/lib/types";

export function ShareRoomModal({
  open,
  roomId,
  roomName,
  onClose,
}: {
  open: boolean;
  roomId: string;
  roomName: string;
  onClose: () => void;
}) {
  const me = useAuth((s) => s.user);
  const [members, setMembers] = useState<RoomMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoomRole>("Editor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !roomId) return;
    let cancelled = false;
    setMembers(null);
    api
      .get<RoomMember[]>(`/rooms/${roomId}/members`)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load members");
      });
    return () => {
      cancelled = true;
    };
  }, [open, roomId]);

  const isOwner = members?.some((m) => m.user.id === me?.id && m.role === "Owner") ?? false;
  const link = typeof window !== "undefined" && open ? `${window.location.origin}/editor?room=${roomId}` : "";

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post<RoomMember>(`/rooms/${roomId}/members`, { email: email.trim(), role });
      const list = await api.get<RoomMember[]>(`/rooms/${roomId}/members`);
      setMembers(list);
      setEmail("");
      toast.success(`Invited ${email.trim()} as ${role.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not invite this person");
    } finally {
      setSending(false);
    }
  }

  async function changeRole(member: RoomMember, next: RoomRole) {
    setMembers((prev) =>
      prev ? prev.map((m) => (m.id === member.id ? { ...m, role: next } : m)) : prev,
    );
    try {
      await api.put(`/rooms/${roomId}/members/${member.user.id}`, { role: next });
      toast.success(`${member.user.displayName} is now a ${next.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change the role");
      const list = await api.get<RoomMember[]>(`/rooms/${roomId}/members`).catch(() => null);
      if (list) setMembers(list);
    }
  }

  async function removeMember(member: RoomMember) {
    try {
      await api.delete(`/rooms/${roomId}/members/${member.user.id}`);
      setMembers((prev) => prev?.filter((m) => m.id !== member.id) ?? null);
      toast.success(`${member.user.displayName} removed`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove this member");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — select the link manually");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Share “${roomName}”`}
      description="Invite people or copy a link to this room."
      size="md"
    >
      <form onSubmit={invite} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="teammate@company.com"
            icon={<Mail className="size-4" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoomRole)}
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-ink-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          aria-label="Role"
        >
          <option value="Editor">Can edit</option>
          <option value="Viewer">Can view</option>
        </select>
        <Button type="submit" loading={sending} disabled={!email.trim()}>
          Invite
        </Button>
      </form>

      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
        <Link2 className="size-4 shrink-0 text-ink-400" />
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-600 outline-none"
          aria-label="Room link"
        />
        <Button size="sm" variant={copied ? "secondary" : "primary"} onClick={copyLink} type="button">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[13px] font-bold text-ink-700">People with access</p>
        {members === null ? (
          <InlineLoader label="Loading members..." />
        ) : (
          <ul className="space-y-1">
            {members.map((m) => {
              const canManage = isOwner && m.role !== "Owner";
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-surface"
                >
                  <Avatar name={m.user.displayName} src={m.user.avatarUrl} color={m.user.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink-900">
                      {m.user.displayName}
                      {m.isOnline ? <span className="size-1.5 rounded-full bg-live" title="Online" /> : null}
                    </p>
                    <p className="truncate text-xs text-ink-400">{m.user.email}</p>
                  </div>

                  {m.role === "Owner" ? (
                    <Badge tone="blue">Owner</Badge>
                  ) : canManage ? (
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value as RoomRole)}
                      className={cn(
                        "h-8 rounded-md border border-line bg-card px-2 text-[13px] font-medium text-ink-700",
                        "outline-none focus:border-brand-500",
                      )}
                      aria-label={`Role for ${m.user.displayName}`}
                    >
                      <option value="Editor">Can edit</option>
                      <option value="Viewer">Can view</option>
                    </select>
                  ) : (
                    <Badge tone={m.role === "Editor" ? "purple" : "gray"}>{m.role}</Badge>
                  )}

                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => removeMember(m)}
                      className="flex size-7 items-center justify-center rounded-md text-ink-400 hover:bg-red-50 hover:text-danger"
                      aria-label={`Remove ${m.user.displayName}`}
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <span className="size-7" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
