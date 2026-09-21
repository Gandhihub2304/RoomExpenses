import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomAdmin } from "@/middleware/require-room-membership";
import { prisma } from "@/lib/prisma";

export const activityLogRouter = Router({ mergeParams: true });

// Audit logs are admin-only — roommates should not see the full action history.
activityLogRouter.use(requireAuth, requireRoomAdmin());

activityLogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 30);

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { roomId: req.roomId! },
        include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where: { roomId: req.roomId! } }),
    ]);

    res.json({ data: items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  }),
);
