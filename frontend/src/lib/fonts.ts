function readCssVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const resolved = new Map<string, string>();

function resolveVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const cached = resolved.get(name);
  if (cached !== undefined) return cached;
  const value = readCssVar(name) || fallback;
  resolved.set(name, value);
  return value;
}

export function getCanvasFontStack(fallback = "'Inter', sans-serif"): string {
  return resolveVar("--font-inter", fallback);
}

const CANVAS_FONT_STACKS: Record<string, { variable: string; fallback: string }> = {
  Inter: { variable: "--font-inter", fallback: "'Inter', sans-serif" },
  "Plus Jakarta Sans": { variable: "--font-jakarta", fallback: "'Plus Jakarta Sans', sans-serif" },
  Roboto: { variable: "--font-roboto", fallback: "'Roboto', sans-serif" },
  Montserrat: { variable: "--font-montserrat", fallback: "'Montserrat', sans-serif" },
  Lato: { variable: "--font-lato", fallback: "'Lato', sans-serif" },
  "Playfair Display": { variable: "--font-playfair", fallback: "'Playfair Display', serif" },
  "Space Grotesk": { variable: "--font-space-grotesk", fallback: "'Space Grotesk', sans-serif" },
  Merriweather: { variable: "--font-merriweather", fallback: "'Merriweather', serif" },
  Caveat: { variable: "--font-caveat", fallback: "'Caveat', cursive" },
};

export function resolveCanvasFontStack(family: string | null | undefined): string {
  if (!family) return getCanvasFontStack();
  const entry = CANVAS_FONT_STACKS[family];
  if (!entry) return family;
  return resolveVar(entry.variable, entry.fallback);
}
