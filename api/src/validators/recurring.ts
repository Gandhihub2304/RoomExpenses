import { z } from "zod";

const participantSchema = z.object({
  userId: z.string().min(1),
  value: z.coerce.number().nonnegative().optional(),
});

export const createRecurringSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive(),
  categoryId: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  splitMethod: z.enum(["EQUAL", "PERCENTAGE", "EXACT", "SHARES", "PAYER_ONLY"]).default("EQUAL"),
  startDate: z.coerce.date(),
  payerId: z.string().min(1),
  participantIds: z.array(z.string()).optional(),
  participants: z.array(participantSchema).optional(),
  autoCreate: z.boolean().default(true),
});
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;

export const updateRecurringSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amount: z.coerce.number().positive().optional(),
  categoryId: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  isActive: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
});
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
