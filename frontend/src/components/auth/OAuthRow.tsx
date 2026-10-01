"use client";

import { useEffect } from "react";
import { FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/store/auth";

const icons: Record<string, React.ReactNode> = {
  Google: <FaGoogle className="size-4.5 text-[#4285F4]" />,
  GitHub: <FaGithub className="size-4.5 text-ink-900" />,
  Microsoft: <FaMicrosoft className="size-4.5 text-[#00A4EF]" />,
};

export function OAuthRow() {
  const { providers, loadProviders } = useAuth();

  useEffect(() => {
    if (providers.length === 0) void loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (providers.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="relative my-5 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="relative bg-card px-3 text-[13px] text-ink-400">or continue with</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {providers.map((p) => {
          const button = (
            <button
              key={p.provider}
              type="button"
              disabled={!p.isConfigured}
              onClick={() => {
                if (p.authorizeUrl && p.isConfigured) window.location.href = p.authorizeUrl;
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-card text-[13px] font-semibold text-ink-700 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              {icons[p.provider] ?? null}
              {p.displayName}
            </button>
          );
          return p.isConfigured ? (
            <div key={p.provider}>{button}</div>
          ) : (
            <Tooltip key={p.provider} label={`${p.displayName} sign-in is not configured`}>
              <div className="w-full">{button}</div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
