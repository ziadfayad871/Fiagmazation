export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "fz.theme";

export function isDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

export function toggleTheme(): Theme {
  const next: Theme = isDark() ? "light" : "dark";
  applyTheme(next);
  return next;
}
