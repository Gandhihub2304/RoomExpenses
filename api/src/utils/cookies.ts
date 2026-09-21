import type { Response } from "express";
import { env, isProd } from "@/config/env";

const ACCESS_COOKIE = "rm_access";
const REFRESH_COOKIE = "rm_refresh";

const baseOptions = {
  httpOnly: true,
  secure: isProd,
  // Frontend (Vercel) and backend (Render) are on different domains in
  // production, so the cookie must be sent cross-site — that requires
  // SameSite=None, which browsers only honor when Secure is also set.
  // In dev, frontend/backend share localhost so Lax is fine and avoids
  // needing HTTPS locally.
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseOptions);
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
