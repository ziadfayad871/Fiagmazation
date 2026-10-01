"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, User2 } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { OAuthRow } from "@/components/auth/OAuthRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setRemember } from "@/lib/session";
import { useAuth } from "@/store/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const { login, status, bootstrap, error, clearError } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const nextErrors: { email?: string; password?: string } = {};
    if (!emailOrUsername.trim()) nextErrors.email = "Enter your email or username";
    if (!password) nextErrors.password = "Enter your password";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setRemember(remember);
    try {
      await login({ emailOrUsername: emailOrUsername.trim(), password });
      router.replace(next);
    } catch {
      /* error surfaced from the auth store */
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back!"
      subtitle="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            Email or username
          </label>
          <Input
            id="email"
            name="email"
            autoComplete="username"
            placeholder="you@example.com"
            icon={<User2 className="size-4" />}
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1.5 text-[13px] text-danger">{errors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink-700">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            icon={<Lock className="size-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(errors.password)}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink-400 hover:text-ink-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
          {errors.password ? <p className="mt-1.5 text-[13px] text-danger">{errors.password}</p> : null}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-line accent-brand-600"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" block size="lg" loading={loading}>
          Sign In
        </Button>
      </form>

      <OAuthRow />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
