import { RecurringFrequency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import { createExpense } from "@/services/expense.service";
import type { CreateRecurringInput, UpdateRecurringInput } from "@/validators/recurring";
import type { CreateExpenseInput } from "@/validators/expense";

function advance(date: Date, frequency: RecurringFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function listRecurring(roomId: string) {
  return prisma.recurringExpense.findMany({
    where: { roomId },
    include: { category: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { nextDueDate: "asc" },
  });
}

export async function createRecurring(roomId: string, createdById: string, input: CreateRecurringInput) {
  const recurring = await prisma.recurringExpense.create({
    data: {
      roomId,
      title: input.title,
      amount: input.amount,
      categoryId: input.categoryId,
      frequency: input.frequency,
      splitMethod: input.splitMethod,
      startDate: input.startDate,
      nextDueDate: input.startDate,
      autoCreate: input.autoCreate,
      createdById,
    },
    include: { category: true },
  });

  await logActivity({
    roomId,
    actorId: createdById,
    action: "CREATE",
    entityType: "RecurringExpense",
    entityId: recurring.id,
    newValue: { title: recurring.title, amount: recurring.amount.toString() },
  });

  return recurring;
}

export async function updateRecurring(
  roomId: string,
  recurringId: string,
  actorId: string,
  input: UpdateRecurringInput,
) {
  const existing = await prisma.recurringExpense.findUnique({ where: { id: recurringId } });
  if (!existing || existing.roomId !== roomId) throw ApiError.notFound("Recurring expense not found");

  const updated = await prisma.recurringExpense.update({
    where: { id: recurringId },
    data: input,
    include: { category: true },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "RecurringExpense",
    entityId: recurringId,
  });

  return updated;
}

export async function deleteRecurring(roomId: string, recurringId: string, actorId: string) {
  const existing = await prisma.recurringExpense.findUnique({ where: { id: recurringId } });
  if (!existing || existing.roomId !== roomId) throw ApiError.notFound("Recurring expense not found");

  await prisma.recurringExpense.update({ where: { id: recurringId }, data: { isActive: false } });

  await logActivity({
    roomId,
    actorId,
    action: "DELETE",
    entityType: "RecurringExpense",
    entityId: recurringId,
  });
}

/**
 * Generates an actual Expense from a recurring template that is now due,
 * and advances nextDueDate. Intended to be called by a scheduled job; also
 * exposed as a manual "generate now" action for admins.
 */
export async function generateDueRecurring(roomId: string, recurringId: string, actorId: string) {
  const recurring = await prisma.recurringExpense.findUnique({ where: { id: recurringId } });
  if (!recurring || recurring.roomId !== roomId) throw ApiError.notFound("Recurring expense not found");
  if (!recurring.isActive) throw ApiError.badRequest("This recurring expense is inactive");

  const memberships = await prisma.roomMembership.findMany({
    where: { roomId, status: "ACTIVE" },
    select: { userId: true },
  });
  const participantIds = memberships.map((m) => m.userId);

  const payload: CreateExpenseInput = {
    title: recurring.title,
    amount: Number(recurring.amount),
    categoryId: recurring.categoryId ?? undefined,
    date: new Date(),
    splitMethod: recurring.splitMethod,
    payers: [{ userId: actorId, amount: Number(recurring.amount) }],
    participantIds: recurring.splitMethod === "EQUAL" ? participantIds : undefined,
    participants:
      recurring.splitMethod !== "EQUAL" && recurring.splitMethod !== "PAYER_ONLY"
        ? participantIds.map((userId) => ({ userId, value: 100 / participantIds.length }))
        : undefined,
  };

  const expense = await createExpense(roomId, actorId, payload);

  const nextDueDate = advance(recurring.nextDueDate, recurring.frequency);
  await prisma.recurringExpense.update({
    where: { id: recurringId },
    data: { nextDueDate },
  });

  await notifyRoomMembers({
    roomId,
    type: "RECURRING_EXPENSE_CREATED",
    title: "Recurring expense created",
    body: `"${recurring.title}" (${recurring.amount.toString()}) was added automatically`,
    metadata: { expenseId: expense.id, recurringExpenseId: recurring.id },
  });

  return expense;
}
