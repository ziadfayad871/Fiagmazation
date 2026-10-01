"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toast";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password }, { auth: false });
      toast.success("Password updated — sign in with your new password");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Invalid link"
        subtitle="This password reset link is incomplete or expired."
        footer={
          <Link href="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
            Request a new link
          </Link>
        }
      >
        <div className="rounded-lg border border-line bg-surface px-4 py-3.5 text-sm text-ink-600">
          Open the link from your email again, or request a fresh one.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something you have not used before."
      footer={
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
          Back to Sign In
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            New password
          </label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            icon={<Lock className="size-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" block size="lg" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
