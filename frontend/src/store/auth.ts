import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import {
  clearSession,
  getAccessToken,
  readRefreshToken,
  readStoredUser,
  writeSession,
} from "@/lib/session";
import type { AuthResponse, ExternalProvider, User } from "@/lib/types";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

type Status = "idle" | "loading" | "authenticated" | "unauthenticated" | "guest";

interface AuthState {
  user: User | null;
  status: Status;
  error: string | null;
  providers: ExternalProvider[];
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateMe: (user: User) => void;
  loadProviders: () => Promise<void>;
  clearError: () => void;
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,
  providers: [],

  bootstrap: async () => {
    if (get().status === "authenticated") return;
    if (bootstrapPromise) return bootstrapPromise;
    if (!getAccessToken() && !readRefreshToken()) {
      clearSession();
      set({ user: null, status: "unauthenticated" });
      return;
    }
    const stored = readStoredUser();
    if (stored) set({ user: stored, status: "loading" });
    else set({ status: "loading" });

    bootstrapPromise = (async () => {
      try {
        const user = await api.get<User>("/auth/me");
        set({ user, status: "authenticated", error: null });
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearSession();
          set({ user: null, status: "unauthenticated" });
        } else {
          // transient failure (network / timeout / 5xx): keep stored tokens so a
          // reload can retry, but stop pretending we know the session state.
          set({ status: "guest", error: null });
        }
      } finally {
        bootstrapPromise = null;
      }
    })();
    return bootstrapPromise;
  },

  login: async (input) => {
    set({ error: null, status: "loading" });
    try {
      const res = await api.post<AuthResponse>("/auth/login", input, { auth: false });
      writeSession(res);
      set({ user: res.user, status: "authenticated", error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in right now.";
      set({ error: message, status: "unauthenticated" });
      throw err;
    }
  },

  register: async (input) => {
    set({ error: null, status: "loading" });
    try {
      const res = await api.post<AuthResponse>("/auth/register", input, { auth: false });
      writeSession(res);
      set({ user: res.user, status: "authenticated", error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to create your account.";
      set({ error: message, status: "unauthenticated" });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = readRefreshToken();
      await api.post("/auth/logout", { refreshToken: refreshToken ?? "" });
    } catch {
      /* even if the server call fails, clear local session */
    }
    clearSession();
    set({ user: null, status: "unauthenticated", error: null });
  },

  updateMe: (user) => set({ user }),

  loadProviders: async () => {
    try {
      const providers = await api.get<ExternalProvider[]>("/auth/external", { auth: false });
      set({ providers });
    } catch {
      set({ providers: [] });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useAuthUser(): User | null {
  return useAuth((s) => s.user);
}
