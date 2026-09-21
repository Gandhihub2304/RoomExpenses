import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type ApiResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        message: data?.message ?? "Something went wrong. Please try again.",
      };
    }

    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      message: "Can't reach the server. Check your connection and try again.",
    };
  }
}

export function login(input: LoginInput) {
  return postJson("/auth/login", input);
}

export function register(input: RegisterInput) {
  return postJson("/auth/register", input);
}

export function forgotPassword(input: ForgotPasswordInput) {
  return postJson("/auth/forgot-password", input);
}

export function resetPassword(token: string, input: ResetPasswordInput) {
  return postJson("/auth/reset-password", { token, ...input });
}

export function resendVerification(email: string) {
  return postJson("/auth/resend-verification", { email });
}
