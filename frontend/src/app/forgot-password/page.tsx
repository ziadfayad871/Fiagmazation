"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ message?: string; devResetUrl?: string | null }>(
        "/auth/forgot-password",
        { email: email.trim() },
        { auth: false },
      );
      setDevLink(res?.devResetUrl ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        title={sent ? "Check your inbox" : "Reset your password"}
        subtitle={
          sent
            ? "If an account exists for this email, a reset link is on its way."
            : "We will email you a link to set a new password."
        }
        footer={
          <>
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
              Back to Sign In
            </Link>
          </>
        }
      >
        {sent ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3.5 text-sm text-brand-800 dark:text-brand-200">
              The reset link expires shortly. Open it to choose a new password, then sign in again.
            </div>
            {devLink && devLink.startsWith("/") ? (
              <a
                href={devLink}
                className="block rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm font-semibold text-flame-700 dark:text-flame-300 hover:bg-flame-100"
              >
                Open reset link (dev mode — no email is sent)
              </a>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            ) : null}
            <div>
              <label htmlFor="resetEmail" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
                Email
              </label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                icon={<Mail className="size-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" block size="lg" loading={loading}>
              Send reset link
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
