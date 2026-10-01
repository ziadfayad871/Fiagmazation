"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User2 } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { OAuthRow } from "@/components/auth/OAuthRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { setRemember } from "@/lib/session";
import { useAuth } from "@/store/auth";
import { toast } from "@/store/toast";

function userNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "creator";
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30) || "creator";
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, status, bootstrap, clearError, error } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    setLoading(true);
    setRemember(true);
    const base = userNameFromEmail(form.email.trim());
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        userName: base,
        password: form.password,
      });
      toast.success("Welcome to Fiagmazation!");
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && /user ?name/i.test(err.message)) {
        try {
          await register({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            userName: `${base}-${Math.random().toString(36).slice(2, 6)}`,
            password: form.password,
          });
          toast.success("Welcome to Fiagmazation!");
          router.replace("/dashboard");
        } catch {
          /* second failure surfaces through the store */
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell split>
      <AuthCard
        title="Create your account"
        subtitle="Start your journey with Fiagmazation"
        footer={
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
              Sign In
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
                <User2 className="size-3.5 text-ink-400" /> First name
              </label>
              <Input
                id="firstName"
                placeholder="Mohamed"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                invalid={Boolean(errors.firstName)}
              />
              {errors.firstName ? <p className="mt-1 text-[12px] text-danger">{errors.firstName}</p> : null}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
                <User2 className="size-3.5 text-ink-400" /> Last name
              </label>
              <Input
                id="lastName"
                placeholder="Hassan"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                invalid={Boolean(errors.lastName)}
              />
              {errors.lastName ? <p className="mt-1 text-[12px] text-danger">{errors.lastName}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="regEmail" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
              <Mail className="size-3.5 text-ink-400" /> Email
            </label>
            <Input
              id="regEmail"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              invalid={Boolean(errors.email)}
            />
            {errors.email ? <p className="mt-1 text-[12px] text-danger">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="regPassword" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-700">
              <Lock className="size-3.5 text-ink-400" /> Password
            </label>
            <Input
              id="regPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
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
            {errors.password ? (
              <p className="mt-1 text-[12px] text-danger">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-ink-400">Must be at least 8 characters.</p>
            )}
          </div>

          <Button type="submit" block size="lg" loading={loading}>
            Create account
          </Button>
        </form>

        <OAuthRow />
      </AuthCard>
    </AuthShell>
  );
}
