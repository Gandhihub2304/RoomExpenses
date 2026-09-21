import { z } from "zod";

export const upsertBudgetSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  totalAmount: z.coerce.number().positive(),
  warningPct: z.coerce.number().int().min(1).max(100).default(80),
  categories: z
    .array(z.object({ categoryId: z.string(), amount: z.coerce.number().nonnegative() }))
    .default([]),
});
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;

export const recordBudgetPaymentSchema = z.object({
  budgetId: z.string().min(1),
  userId: z.string().min(1),
  paidAmount: z.coerce.number().nonnegative(),
});
export type RecordBudgetPaymentInput = z.infer<typeof recordBudgetPaymentSchema>;
