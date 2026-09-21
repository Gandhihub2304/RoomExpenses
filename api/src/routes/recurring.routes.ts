import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import { createRecurringSchema, updateRecurringSchema } from "@/validators/recurring";
import * as recurringService from "@/services/recurring.service";

export const recurringRouter = Router({ mergeParams: true });

recurringRouter.use(requireAuth, requireRoomMembership());

recurringRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await recurringService.listRecurring(req.roomId!);
    res.json({ data: items });
  }),
);

recurringRouter.post(
  "/",
  requireRoomAdmin(),
  validateBody(createRecurringSchema),
  asyncHandler(async (req, res) => {
    const item = await recurringService.createRecurring(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: item });
  }),
);

recurringRouter.patch(
  "/:recurringId",
  requireRoomAdmin(),
  validateBody(updateRecurringSchema),
  asyncHandler(async (req, res) => {
    const item = await recurringService.updateRecurring(req.roomId!, req.params.recurringId, req.userId!, req.body);
    res.json({ data: item });
  }),
);

recurringRouter.post(
  "/:recurringId/generate",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    const expense = await recurringService.generateDueRecurring(req.roomId!, req.params.recurringId, req.userId!);
    res.status(201).json({ data: expense });
  }),
);

recurringRouter.delete(
  "/:recurringId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await recurringService.deleteRecurring(req.roomId!, req.params.recurringId, req.userId!);
    res.json({ data: { success: true } });
  }),
);
