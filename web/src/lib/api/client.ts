import { toast } from "sonner";

// Relative by default so requests go through this app's own origin (see the
// rewrite in next.config.ts) and stay first-party for cookies. Only set
// NEXT_PUBLIC_API_URL if you intentionally want the browser to call the
// backend directly (breaks cross-site cookie persistence on some browsers).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string; fieldErrors?: Record<string, string[]> };

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
}

function send(path: string, init: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
}

// The access cookie lives 15 minutes; the refresh cookie lives much longer.
// Without this, every request starts failing with 401 a quarter-hour after
// login and pages silently keep showing whatever they loaded last.
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession() {
  refreshInFlight ??= send("/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    let res = await send(path, init);

    if (res.status === 401 && !NO_REFRESH_PATHS.includes(path) && (await refreshSession())) {
      res = await send(path, init);
    }

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const errorBody = body as ApiErrorBody | null;
      return {
        ok: false,
        message: errorBody?.error?.message ?? "Something went wrong. Please try again.",
        code: errorBody?.error?.code,
        fieldErrors: errorBody?.error?.details,
      };
    }

    const data = body && typeof body === "object" && "data" in body ? body.data : body;
    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      message: "Can't reach the server. Check your connection and try again.",
    };
  }
}

// Mutations already report their own errors; loads mostly don't, which used to
// leave stale numbers on screen with no hint that the refresh failed.
async function load<T>(path: string): Promise<ApiResult<T>> {
  const result = await request<T>(path, { method: "GET" });
  if (!result.ok && path !== "/auth/me" && typeof window !== "undefined") {
    toast.error(`Couldn't load the latest data: ${result.message}`, { id: "api-load-error" });
  }
  return result;
}

export const api = {
  get: <T>(path: string) => load<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
