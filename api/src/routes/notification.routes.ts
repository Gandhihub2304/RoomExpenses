import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const unreadOnly = req.query.unreadOnly === "true";

    const where = { userId: req.userId!, ...(unreadOnly ? { readAt: null } : {}) };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.userId!, readAt: null } }),
    ]);

    res.json({
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      unreadCount,
    });
  }),
);

notificationRouter.post(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.notificationId },
    });
    if (!notification || notification.userId !== req.userId) {
      throw ApiError.notFound("Notification not found");
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
    res.json({ data: updated });
  }),
);

notificationRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ data: { success: true } });
  }),
);
