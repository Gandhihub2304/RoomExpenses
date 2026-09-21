import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership } from "@/middleware/require-room-membership";
import { getAdminDashboard, getRoommateDashboard } from "@/services/dashboard.service";

export const dashboardRouter = Router({ mergeParams: true });

dashboardRouter.use(requireAuth, requireRoomMembership());

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    if (req.roomRole === "ADMIN") {
      const data = await getAdminDashboard(req.roomId!, month, year);
      res.json({ data: { ...data, viewerRole: "ADMIN" } });
      return;
    }

    const data = await getRoommateDashboard(req.roomId!, req.userId!, month, year);
    res.json({ data: { ...data, viewerRole: "ROOMMATE" } });
  }),
);
