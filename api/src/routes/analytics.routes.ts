import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership } from "@/middleware/require-room-membership";
import { getAnalytics } from "@/services/analytics.service";

export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.use(requireAuth, requireRoomMembership());

analyticsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const months = req.query.months ? Number(req.query.months) : 6;
    const data = await getAnalytics(req.roomId!, months);
    res.json({ data });
  }),
);
