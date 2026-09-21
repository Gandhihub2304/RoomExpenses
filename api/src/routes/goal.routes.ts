import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody, validateQuery } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import {
  createGoalSchema,
  addContributionSchema,
  suggestContributionSchema,
} from "@/validators/goal";
import * as goalService from "@/services/goal.service";

export const goalRouter = Router({ mergeParams: true });

goalRouter.use(requireAuth, requireRoomMembership());

goalRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const goal = await goalService.getActiveGoal(req.roomId!);
    res.json({ data: goal });
  }),
);

goalRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const goals = await goalService.listGoalHistory(req.roomId!);
    res.json({ data: goals });
  }),
);

goalRouter.get(
  "/suggested-contribution",
  requireRoomAdmin(),
  validateQuery(suggestContributionSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as { month?: number; year?: number };
    const data = await goalService.suggestContribution(req.roomId!, query.month, query.year);
    res.json({ data });
  }),
);

goalRouter.post(
  "/",
  requireRoomAdmin(),
  validateBody(createGoalSchema),
  asyncHandler(async (req, res) => {
    const goal = await goalService.createGoal(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: goal });
  }),
);

goalRouter.post(
  "/contributions",
  requireRoomAdmin(),
  validateBody(addContributionSchema),
  asyncHandler(async (req, res) => {
    const result = await goalService.addContribution(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: result });
  }),
);

goalRouter.post(
  "/:goalId/complete",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    const goal = await goalService.completeGoal(req.roomId!, req.params.goalId, req.userId!);
    res.json({ data: goal });
  }),
);

goalRouter.delete(
  "/:goalId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await goalService.cancelGoal(req.roomId!, req.params.goalId, req.userId!);
    res.json({ data: { success: true } });
  }),
);
