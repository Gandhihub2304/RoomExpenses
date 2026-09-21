import type { NextFunction, Request, Response } from "express";
import { RoomRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { asyncHandler } from "@/utils/async-handler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      roomId?: string;
      roomRole?: RoomRole;
    }
  }
}

/**
 * Loads the caller's membership for :roomId and attaches roomRole to the request.
 * Every room-scoped route must use this — never trust a roomId from the URL/body
 * without verifying the caller actually belongs to that room.
 */
export function requireRoomMembership(options?: { roles?: RoomRole[] }) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const roomId = req.params.roomId;
    if (!roomId) {
      throw ApiError.badRequest("Room id is required");
    }
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const membership = await prisma.roomMembership.findUnique({
      where: { roomId_userId: { roomId, userId: req.userId } },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw ApiError.forbidden("You don't have access to this room");
    }

    if (options?.roles && !options.roles.includes(membership.role)) {
      throw ApiError.forbidden("Only room admins can perform this action");
    }

    req.roomId = roomId;
    req.roomRole = membership.role;
    next();
  });
}

export function requireRoomAdmin() {
  return requireRoomMembership({ roles: [RoomRole.ADMIN] });
}
