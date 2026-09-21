import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody, validateQuery } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import { createExpenseSchema, listExpensesQuerySchema } from "@/validators/expense";
import * as expenseService from "@/services/expense.service";

export const expenseRouter = Router({ mergeParams: true });

expenseRouter.use(requireAuth, requireRoomMembership());

expenseRouter.get(
  "/",
  validateQuery(listExpensesQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await expenseService.listExpenses(
      req.roomId!,
      req.query as unknown as Parameters<typeof expenseService.listExpenses>[1],
    );
    res.json({ data: result.items, pagination: result.pagination });
  }),
);

expenseRouter.post(
  "/",
  validateBody(createExpenseSchema),
  asyncHandler(async (req, res) => {
    const expense = await expenseService.createExpense(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: expense });
  }),
);

expenseRouter.get(
  "/:expenseId",
  asyncHandler(async (req, res) => {
    const expense = await expenseService.getExpense(req.roomId!, req.params.expenseId);
    res.json({ data: expense });
  }),
);

// Editing, archiving, and deleting expenses are admin-only actions — enforced
// here server-side regardless of what the client sends or hides in the UI.
expenseRouter.put(
  "/:expenseId",
  requireRoomAdmin(),
  validateBody(createExpenseSchema),
  asyncHandler(async (req, res) => {
    const expense = await expenseService.updateExpense(
      req.roomId!,
      req.params.expenseId,
      req.userId!,
      req.body,
    );
    res.json({ data: expense });
  }),
);

expenseRouter.post(
  "/:expenseId/archive",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    const expense = await expenseService.archiveExpense(req.roomId!, req.params.expenseId, req.userId!);
    res.json({ data: expense });
  }),
);

expenseRouter.delete(
  "/:expenseId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await expenseService.deleteExpense(req.roomId!, req.params.expenseId, req.userId!);
    res.json({ data: { success: true } });
  }),
);
