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
