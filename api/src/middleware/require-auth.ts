import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/api-error";
import { verifyAccessToken } from "@/utils/tokens";
import { ACCESS_COOKIE } from "@/utils/cookies";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (!token) {
    throw ApiError.unauthorized("Please log in to continue");
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }
}
