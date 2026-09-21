import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import { createBillSchema, updateBillSchema, markBillPaidSchema } from "@/validators/bill";
import * as billService from "@/services/bill.service";

export const billRouter = Router({ mergeParams: true });

billRouter.use(requireAuth, requireRoomMembership());

billRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const bills = await billService.listBills(req.roomId!);
    res.json({ data: bills });
  }),
);

billRouter.post(
  "/",
  requireRoomAdmin(),
  validateBody(createBillSchema),
  asyncHandler(async (req, res) => {
    const bill = await billService.createBill(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: bill });
  }),
);

billRouter.patch(
  "/:billId",
  requireRoomAdmin(),
  validateBody(updateBillSchema),
  asyncHandler(async (req, res) => {
    const bill = await billService.updateBill(req.roomId!, req.params.billId, req.userId!, req.body);
    res.json({ data: bill });
  }),
);

billRouter.post(
  "/:billId/pay",
  requireRoomAdmin(),
  validateBody(markBillPaidSchema),
  asyncHandler(async (req, res) => {
    const bill = await billService.markBillPaid(req.roomId!, req.params.billId, req.userId!, req.body.receiptUrl);
    res.json({ data: bill });
  }),
);

billRouter.delete(
  "/:billId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await billService.deleteBill(req.roomId!, req.params.billId, req.userId!);
    res.json({ data: { success: true } });
  }),
);
