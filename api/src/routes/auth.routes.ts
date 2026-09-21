import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { authRateLimit } from "@/middleware/rate-limit";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/utils/cookies";
import { ApiError } from "@/utils/api-error";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "@/validators/auth";
import {
  registerUser,
  loginUser,
  issueSession,
  refreshSession,
  revokeSession,
  revokeAllSessions,
  verifyEmailToken,
  resendVerification,
  requestPasswordReset,
  resetPassword,
} from "@/services/auth.service";

export const authRouter = Router();

function sanitizeUser(user: { id: string; name: string; email: string; avatarUrl: string | null; emailVerified: boolean; currencyPref: string; themePref: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    currencyPref: user.currencyPref,
    themePref: user.themePref,
  };
}

authRouter.post(
  "/register",
  authRateLimit,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    res.status(201).json({ data: sanitizeUser(user) });
  }),
);

authRouter.post(
  "/login",
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await loginUser(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ data: sanitizeUser(user) });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw ApiError.unauthorized("Please log in again.");

    const { accessToken, user } = await refreshSession(refreshToken);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ data: sanitizeUser(user) });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) await revokeSession(refreshToken);
    clearAuthCookies(res);
    res.json({ data: { success: true } });
  }),
);

authRouter.post(
  "/logout-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeAllSessions(req.userId!);
    clearAuthCookies(res);
    res.json({ data: { success: true } });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw ApiError.unauthorized();
    res.json({ data: sanitizeUser(user) });
  }),
);

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    await verifyEmailToken(req.body.token);
    res.json({ data: { success: true } });
  }),
);

authRouter.post(
  "/resend-verification",
  authRateLimit,
  validateBody(resendVerificationSchema),
  asyncHandler(async (req, res) => {
    await resendVerification(req.body.email);
    res.json({ data: { success: true } });
  }),
);

authRouter.post(
  "/forgot-password",
  authRateLimit,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await requestPasswordReset(req.body.email);
    res.json({ data: { success: true } });
  }),
);

authRouter.post(
  "/reset-password",
  authRateLimit,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await resetPassword(req.body.token, req.body.password);
    res.json({ data: { success: true } });
  }),
);
