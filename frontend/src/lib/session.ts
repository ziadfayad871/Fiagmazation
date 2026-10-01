import type { User } from "./types";

const ACCESS_KEY = "fz.access";
const REFRESH_KEY = "fz.refresh";
const EXPIRES_KEY = "fz.expires";
const USER_KEY = "fz.user";
const CLIENT_KEY = "fz.client";
const REMEMBER_KEY = "fz.remember";

let memoryAccess: string | null = null;

export function setRemember(remember: boolean): void {
  if (typeof window === "undefined") return;
  if (remember) window.localStorage.setItem(REMEMBER_KEY, "1");
  else window.localStorage.removeItem(REMEMBER_KEY);
}

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REMEMBER_KEY) === "1"
    ? window.localStorage
    : window.sessionStorage;
}

function anyStore(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
}

export function getClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(CLIENT_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cid-${Math.random().toString(36).slice(2)}${Date.now()}`;
    window.sessionStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

export function getAccessToken(): string | null {
  if (memoryAccess) return memoryAccess;
  if (typeof window === "undefined") return null;
  memoryAccess = anyStore(ACCESS_KEY);
  return memoryAccess;
}

export function setAccessToken(token: string | null): void {
  memoryAccess = token;
  const target = store();
  if (!target) return;
  if (token) target.setItem(ACCESS_KEY, token);
  else {
    target.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(ACCESS_KEY);
  }
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export function writeSession(session: StoredSession): void {
  setAccessToken(session.accessToken);
  const target = store();
  if (!target) return;
  target.setItem(REFRESH_KEY, session.refreshToken);
  target.setItem(EXPIRES_KEY, session.expiresAt);
  target.setItem(USER_KEY, JSON.stringify(session.user));
}

export function readStoredUser(): User | null {
  const raw = anyStore(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function readRefreshToken(): string | null {
  return anyStore(REFRESH_KEY);
}

export function readExpiresAt(): string | null {
  return anyStore(EXPIRES_KEY);
}

export function clearSession(): void {
  memoryAccess = null;
  if (typeof window === "undefined") return;
  for (const s of [window.sessionStorage, window.localStorage]) {
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem(EXPIRES_KEY);
    s.removeItem(USER_KEY);
  }
}
