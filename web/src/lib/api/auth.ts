import { api } from "@/lib/api/client";
import type { User } from "@/lib/types";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/auth";

export function login(input: LoginInput) {
  return api.post<User>("/auth/login", {
    email: input.email,
    password: input.password,
    remember: input.remember,
  });
}

export function register(input: RegisterInput) {
  return api.post<User>("/auth/register", {
    name: input.name,
    email: input.email,
    password: input.password,
  });
}

export function logout() {
  return api.post<{ success: boolean }>("/auth/logout");
}

export function getCurrentUser() {
  return api.get<User>("/auth/me");
}

export function forgotPassword(input: ForgotPasswordInput) {
  return api.post<{ success: boolean }>("/auth/forgot-password", input);
}

export function resetPassword(token: string, input: ResetPasswordInput) {
  return api.post<{ success: boolean }>("/auth/reset-password", {
    token,
    password: input.password,
  });
}

export function resendVerification(email: string) {
  return api.post<{ success: boolean }>("/auth/resend-verification", { email });
}

export function verifyEmail(token: string) {
  return api.post<{ success: boolean }>("/auth/verify-email", { token });
}

export function updateProfile(input: { name?: string; currencyPref?: string; themePref?: string }) {
  return api.patch<User>("/auth/me", input);
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return api.post<{ success: boolean }>("/auth/change-password", input);
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

export function listSessions() {
  return api.get<SessionInfo[]>("/auth/sessions");
}

export function revokeSession(sessionId: string) {
  return api.delete<{ success: boolean }>(`/auth/sessions/${sessionId}`);
}

export function logoutAll() {
  return api.post<{ success: boolean }>("/auth/logout-all");
}
