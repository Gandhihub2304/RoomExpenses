const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
      ...init,
    });

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

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
