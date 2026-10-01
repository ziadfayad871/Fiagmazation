"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { setAccessToken, writeSession } from "@/lib/session";
import { useAuth } from "@/store/auth";
import { toast } from "@/store/toast";
import type { User } from "@/lib/types";

type Outcome =
  | { kind: "pending" }
  | { kind: "done" }
  | { kind: "failed"; title: string; message: string };

function parseHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "pending" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = parseHash(window.location.hash);

    const errorCode = params.get("error");
    const errorMessage = params.get("message");
    if (errorCode) {
      setOutcome({
        kind: "failed",
        title: "Sign-in failed",
        message: errorMessage || "The provider could not complete the sign-in.",
      });
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresAt = params.get("expires_at");
    if (!accessToken || !refreshToken || !expiresAt) {
      setOutcome({
        kind: "failed",
        title: "Sign-in failed",
        message: "The provider did not return session tokens.",
      });
      return;
    }

    setAccessToken(accessToken);

    void (async () => {
      try {
        const user = await api.get<User>("/auth/me");
        writeSession({ accessToken, refreshToken, expiresAt, user });
        useAuth.setState({ user, status: "authenticated", error: null });
        setOutcome({ kind: "done" });
        toast.success(`Welcome, ${user.firstName || user.displayName}!`);
        router.replace("/dashboard");
      } catch {
        setAccessToken(null);
        setOutcome({
          kind: "failed",
          title: "Sign-in failed",
          message: "We could not load your account. Please try signing in again.",
        });
      }
    })();
  }, [router]);

  return (
    <AuthShell>
      <AuthCard
        title={outcome.kind === "failed" ? outcome.title : "Signing you in"}
        subtitle={
          outcome.kind === "failed"
            ? "Something went wrong while completing sign-in."
            : "Hang tight while we finish setting up your session."
        }
        footer={
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:hover:text-brand-300">
            Back to Sign In
          </Link>
        }
      >
        {outcome.kind === "failed" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{outcome.message}</span>
            </div>
            <Button block size="lg" onClick={() => router.replace("/login")}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3.5 text-sm text-brand-800 dark:text-brand-200">
            <Loader2 className="size-4 shrink-0 animate-spin" />
            Completing sign-in…
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
