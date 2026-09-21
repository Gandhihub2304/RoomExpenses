import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import { upsertBudgetSchema, recordBudgetPaymentSchema } from "@/validators/budget";
import * as budgetService from "@/services/budget.service";

export const budgetRouter = Router({ mergeParams: true });

budgetRouter.use(requireAuth, requireRoomMembership());

budgetRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data =
      month && year
        ? await budgetService.getBudgetForMonth(req.roomId!, month, year)
        : await budgetService.getCurrentBudget(req.roomId!);
    res.json({ data });
  }),
);

budgetRouter.put(
  "/",
  requireRoomAdmin(),
  validateBody(upsertBudgetSchema),
  asyncHandler(async (req, res) => {
    const data = await budgetService.upsertBudget(req.roomId!, req.userId!, req.body);
    res.json({ data });
  }),
);

// Roommates can record their own contribution; admins can record for anyone
// (enforced in the service, since it depends on whose userId is being set).
budgetRouter.post(
  "/payments",
  validateBody(recordBudgetPaymentSchema),
  asyncHandler(async (req, res) => {
    const data = await budgetService.recordMemberPayment(
      req.roomId!,
      req.userId!,
      req.roomRole!,
      req.body,
    );
    res.json({ data });
  }),
);
