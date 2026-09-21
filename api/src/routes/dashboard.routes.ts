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
    if (req.roomRole === "ADMIN") {
      const data = await getAdminDashboard(req.roomId!);
      res.json({ data: { ...data, viewerRole: "ADMIN" } });
      return;
    }

    const data = await getRoommateDashboard(req.roomId!, req.userId!);
    res.json({ data: { ...data, viewerRole: "ROOMMATE" } });
  }),
);
