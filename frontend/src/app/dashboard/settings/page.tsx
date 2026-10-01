"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/session";
import { useAuth } from "@/store/auth";
import { toast } from "@/store/toast";
import type { User } from "@/lib/types";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-[15px] font-extrabold text-ink-900">{title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileForm({ user }: { user: User }) {
  const updateMe = useAuth((s) => s.updateMe);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    jobTitle: user.jobTitle ?? "",
    avatarUrl: user.avatarUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put<User>("/auth/me", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        jobTitle: form.jobTitle.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
      });
      updateMe(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    form.firstName !== user.firstName ||
    form.lastName !== user.lastName ||
    form.jobTitle !== (user.jobTitle ?? "") ||
    form.avatarUrl !== (user.avatarUrl ?? "");

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            First name
          </label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
            maxLength={60}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            Last name
          </label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
            maxLength={60}
          />
        </div>
      </div>
      <div>
        <label htmlFor="jobTitle" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
          Job title <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <Input
          id="jobTitle"
          placeholder="Product Designer"
          value={form.jobTitle}
          onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
          maxLength={120}
        />
      </div>
      <div>
        <label htmlFor="avatarUrl" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
          Avatar URL <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <Input
          id="avatarUrl"
          placeholder="https://…"
          value={form.avatarUrl}
          onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
          maxLength={500}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={saving} disabled={!dirty}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change your password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">{error}</div>
      ) : null}
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
          Current password
        </label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            New password
          </label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            required
            minLength={8}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={saving} disabled={!form.currentPassword || !form.newPassword}>
          Change password
        </Button>
      </div>
    </form>
  );
}

function SessionsSection({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOutEverywhere() {
    setBusy(true);
    let failed = false;
    try {
      await api.post("/auth/logout-all");
    } catch {
      failed = true;
    }
    clearSession();
    useAuth.setState({ user: null, status: "unauthenticated", error: null, providers: [] });
    if (failed) {
      toast.error("Could not sign out on all devices — this session was closed anyway");
    } else {
      toast.success("Signed out on all devices");
    }
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[13px] leading-relaxed text-ink-500">
        Signed in as <span className="font-semibold text-ink-800">{user.email}</span>. Ending all sessions signs
        you out everywhere, including this device.
      </div>
      <Button
        variant="secondary"
        icon={<LogOut className="size-4" />}
        loading={busy}
        onClick={() => void signOutEverywhere()}
        className="shrink-0"
      >
        Sign out everywhere
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuth((s) => s.user);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[28px]">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your profile, password, and sessions.</p>
      </div>

      <div className="space-y-5">
        <Section icon={UserIcon} title="Profile" description="How you appear to collaborators in shared rooms.">
          <ProfileForm user={user} />
        </Section>

        <Section icon={KeyRound} title="Password" description="Use a strong password you do not reuse elsewhere.">
          <PasswordForm />
        </Section>

        <Section
          icon={ShieldCheck}
          title="Sessions"
          description="Control where your account is currently signed in."
        >
          <SessionsSection user={user} />
        </Section>

        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">Account</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[12px] font-semibold text-ink-400">Email</dt>
              <dd className="mt-0.5 font-medium text-ink-800">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-ink-400">Username</dt>
              <dd className="mt-0.5 font-medium text-ink-800">{user.userName}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-ink-400">Member since</dt>
              <dd className="mt-0.5 font-medium text-ink-800">
                {new Date(user.createdAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-ink-400">Display name</dt>
              <dd className="mt-0.5 font-medium text-ink-800">{user.displayName}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
