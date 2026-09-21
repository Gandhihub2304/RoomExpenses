import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().trim().min(2).max(120),
  targetAmount: z.coerce.number().positive(),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const suggestContributionSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});
export type SuggestContributionInput = z.infer<typeof suggestContributionSchema>;

export const addContributionSchema = z.object({
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  note: z.string().trim().max(300).optional(),
});
export type AddContributionInput = z.infer<typeof addContributionSchema>;
