import { z } from "zod";

export const createSettlementSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.coerce.number().positive(),
  upiRef: z.string().trim().max(100).optional(),
  paymentNote: z.string().trim().max(300).optional(),
  screenshotUrl: z.string().url().optional(),
});
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

export const updateSettlementStatusSchema = z.object({
  status: z.enum(["SETTLED", "CANCELLED", "PARTIALLY_PAID"]),
  upiRef: z.string().trim().max(100).optional(),
  paymentNote: z.string().trim().max(300).optional(),
});
export type UpdateSettlementStatusInput = z.infer<typeof updateSettlementStatusSchema>;
