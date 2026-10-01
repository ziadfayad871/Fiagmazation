"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { isDark, toggleTheme, type Theme } from "@/lib/theme";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ tooltipSide = "bottom" }: { tooltipSide?: "top" | "bottom" | "left" | "right" }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(isDark() ? "dark" : "light");
  }, []);

  return (
    <Tooltip label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} side={tooltipSide}>
      <button
        type="button"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={theme === "dark"}
        data-testid="theme-toggle"
        onClick={() => setTheme(toggleTheme())}
        className={cn(
          "flex size-9 items-center justify-center rounded-md transition-colors hover:bg-line-soft",
          theme === "dark" ? "text-brand-400" : "text-ink-500 hover:text-ink-900",
        )}
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </Tooltip>
  );
}
