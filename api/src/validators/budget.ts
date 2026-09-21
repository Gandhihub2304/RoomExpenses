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
