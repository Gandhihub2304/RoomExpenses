import { z } from "zod";

export const createBillSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive(),
  categoryId: z.string().optional(),
  dueDate: z.coerce.date(),
});
export type CreateBillInput = z.infer<typeof createBillSchema>;

export const updateBillSchema = createBillSchema.partial();
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const markBillPaidSchema = z.object({
  receiptUrl: z.string().url().optional(),
});
export type MarkBillPaidInput = z.infer<typeof markBillPaidSchema>;
