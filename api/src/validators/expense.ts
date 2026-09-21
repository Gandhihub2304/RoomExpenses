import { z } from "zod";

const payerSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive(),
});

const participantSchema = z.object({
  userId: z.string().min(1),
  value: z.coerce.number().nonnegative().optional(), // percentage or shares or exact amount, per splitMethod
});

export const createExpenseSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    categoryId: z.string().optional(),
    date: z.coerce.date().default(() => new Date()),
    splitMethod: z.enum(["EQUAL", "PERCENTAGE", "EXACT", "SHARES", "PAYER_ONLY"]).default("EQUAL"),
    notes: z.string().trim().max(500).optional(),
    payers: z.array(payerSchema).min(1, "At least one payer is required"),
    participantIds: z.array(z.string()).optional(),
    participants: z.array(participantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const payerSum = data.payers.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(payerSum - data.amount) > 0.01) {
      ctx.addIssue({
        code: "custom",
        message: "The amounts paid must add up to the total expense amount",
        path: ["payers"],
      });
    }

    if (data.splitMethod !== "PAYER_ONLY") {
      const hasParticipants =
        (data.participantIds && data.participantIds.length > 0) ||
        (data.participants && data.participants.length > 0);
      if (!hasParticipants) {
        ctx.addIssue({
          code: "custom",
          message: "Select at least one participant to split this expense with",
          path: ["participants"],
        });
      }
    }

    if (["PERCENTAGE", "EXACT", "SHARES"].includes(data.splitMethod)) {
      if (!data.participants || data.participants.some((p) => p.value === undefined)) {
        ctx.addIssue({
          code: "custom",
          message: `Each participant needs a value for ${data.splitMethod.toLowerCase()} split`,
          path: ["participants"],
        });
      }
    }
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  payerId: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING_APPROVAL", "ARCHIVED"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
