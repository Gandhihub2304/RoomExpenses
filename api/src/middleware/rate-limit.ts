import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { verifyAccessToken } from "@/utils/tokens";
import { ACCESS_COOKIE } from "@/utils/cookies";

// All browser traffic reaches this API through the frontend's /api proxy, so
// req.ip is the proxy's address and is shared by every user. Keying limits by
// IP alone makes one busy user (or a handful of normal ones) exhaust the
// budget for everybody, so key by the signed-in user whenever possible.
function clientKey(req: Request) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (token) {
    try {
      return `user:${verifyAccessToken(token).sub}`;
    } catch {
      // expired/invalid token — fall through to IP
    }
  }
  return `ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Per-account brute-force protection; the shared proxy IP can't be used here.
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email ? `email:${email}` : clientKey(req);
  },
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again later." } },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many requests. Slow down." } },
});
