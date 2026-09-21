import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { hashPassword, verifyPassword } from "@/utils/password";
import { signAccessToken, generateRefreshToken, generateSecureToken } from "@/utils/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/services/email.service";
import { env } from "@/config/env";
import type { RegisterInput, LoginInput } from "@/validators/auth";

const REFRESH_TTL_MS = () => env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    // Do not reveal whether the account exists to avoid user enumeration.
    throw ApiError.conflict("If this email isn't already registered, check your inbox to verify it.");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  const token = generateSecureToken();
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "VERIFY_EMAIL",
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  sendVerificationEmail(user.email, token);

  return user;
}

export async function issueSession(
  userId: string,
  email: string,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS()),
    },
  });

  return { accessToken, refreshToken };
}

export async function loginUser(
  input: LoginInput,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  const tokens = await issueSession(user.id, user.email, meta);
  return { user, ...tokens };
}

export async function refreshSession(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw ApiError.unauthorized("Session expired. Please log in again.");
  }

  const accessToken = signAccessToken({ sub: session.user.id, email: session.user.email });
  return { accessToken, user: session.user };
}

export async function revokeSession(refreshToken: string) {
  await prisma.session.updateMany({
    where: { refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.emailToken.findUnique({ where: { token } });

  if (!record || record.type !== "VERIFY_EMAIL" || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("This verification link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return;

  const token = generateSecureToken();
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "VERIFY_EMAIL",
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  sendVerificationEmail(user.email, token);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal account existence.

  const token = generateSecureToken();
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "RESET_PASSWORD",
      token,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.emailToken.findUnique({ where: { token } });

  if (!record || record.type !== "RESET_PASSWORD" || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
