import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership } from "@/middleware/require-room-membership";
import { createSettlementSchema, updateSettlementStatusSchema } from "@/validators/settlement";
import * as settlementService from "@/services/settlement.service";
import { getUserBalance } from "@/services/balance.service";

export const settlementRouter = Router({ mergeParams: true });

settlementRouter.use(requireAuth, requireRoomMembership());

settlementRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const overview = await settlementService.getRoomSettlementOverview(req.roomId!);
    res.json({ data: overview });
  }),
);

settlementRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const result = await settlementService.listSettlementHistory(req.roomId!, page, pageSize);
    res.json({ data: result.items, pagination: result.pagination });
  }),
);

settlementRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const balance = await getUserBalance(req.roomId!, req.userId!);
    res.json({ data: { balance } });
  }),
);

settlementRouter.post(
  "/",
  validateBody(createSettlementSchema),
  asyncHandler(async (req, res) => {
    const settlement = await settlementService.createSettlement(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: settlement });
  }),
);

settlementRouter.patch(
  "/:settlementId",
  validateBody(updateSettlementStatusSchema),
  asyncHandler(async (req, res) => {
    const settlement = await settlementService.updateSettlementStatus(
      req.roomId!,
      req.params.settlementId,
      req.userId!,
      req.roomRole!,
      req.body,
    );
    res.json({ data: settlement });
  }),
);
