import {
  clearSession,
  getAccessToken,
  getClientId,
  readRefreshToken,
  setAccessToken,
  writeSession,
  type StoredSession,
} from "./session";
import type { AuthResponse } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5077/api";
export const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:5077/hubs/room";

export class ApiError extends Error {
  status: number;
  details: Record<string, string[]> | null;

  constructor(message: string, status: number, details: Record<string, string[]> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  formData?: FormData;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let details: Record<string, string[]> | null = null;
  let specific = false;
  try {
    const payload = await res.json();
    if (typeof payload?.detail === "string" && payload.detail) {
      message = payload.detail;
      specific = true;
    } else if (typeof payload?.message === "string" && payload.message) {
      message = payload.message;
      specific = true;
    }
    if (payload?.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
      details = payload.errors;
    }
    if (Array.isArray(payload?.errors)) {
      details = { form: payload.errors.map((e: unknown) => String(e)) };
    }
    if (!specific && details) {
      const first = Object.values(details).find((value) => Array.isArray(value) && value.length > 0);
      if (typeof first?.[0] === "string" && first[0]) {
        message = first[0];
        specific = true;
      }
    }
    if (!specific && typeof payload?.title === "string" && payload.title) message = payload.title;
  } catch {
    /* non-JSON error body */
  }
  if (res.status === 401 && message === "Request failed (401)") message = "Your session has expired.";
  return new ApiError(message, res.status, details);
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = readRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-Id": getClientId() },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const data = (await res.json()) as AuthResponse;
      writeSession(data as StoredSession);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, query, formData, headers = {}, auth = true, signal } = options;
  const doFetch = async (token: string | null): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    finalHeaders["X-Client-Id"] = getClientId();
    let payload: BodyInit | undefined;
    if (formData) {
      payload = formData;
    } else if (body !== undefined) {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    return fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: payload,
      credentials: "include",
      signal,
    });
  };

  const token = getAccessToken();
  const safeFetch = async (current: string | null): Promise<Response> => {
    try {
      return await doFetch(current);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[api] ${method} ${buildUrl(path, query)} ->`, err);
      const hint =
        reason === "Failed to fetch"
          ? `Cannot reach the API at ${API_URL} (network or CORS error)`
          : `Request to ${API_URL} failed: ${reason}`;
      throw new ApiError(hint, 0);
    }
  };

  let response = await safeFetch(auth ? token : null);

  if (response.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await safeFetch(newToken);
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(`The API returned a non-JSON response for ${path}`, 0);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<ApiOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

export { setAccessToken };
