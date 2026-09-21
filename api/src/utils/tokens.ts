import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { env } from "@/config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

export function generateRefreshToken() {
  return randomBytes(48).toString("hex");
}

export function generateSecureToken() {
  return randomBytes(32).toString("hex");
}
