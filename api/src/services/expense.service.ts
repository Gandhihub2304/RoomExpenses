import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { splitEqually, splitByPercentage, splitByShares, validateExactSplit } from "@/utils/money";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import type { CreateExpenseInput, ListExpensesQuery } from "@/validators/expense";

async function assertMembers(roomId: string, userIds: string[]) {
  const unique = Array.from(new Set(userIds));
  const members = await prisma.roomMembership.findMany({
    where: { roomId, userId: { in: unique }, status: "ACTIVE" },
    select: { userId: true },
  });
  if (members.length !== unique.length) {
    throw ApiError.badRequest("All payers and participants must be active members of this room");
  }
}

function computeShares(input: CreateExpenseInput): { userId: string; share: Decimal; percentage?: number; shares?: number }[] {
  if (input.splitMethod === "PAYER_ONLY") {
    return [];
  }

  const participantIds = input.participants
    ? input.participants.map((p) => p.userId)
    : input.participantIds ?? [];

  if (input.splitMethod === "EQUAL") {
    const shares = splitEqually(input.amount, participantIds.length);
    return participantIds.map((userId, i) => ({ userId, share: shares[i] }));
  }

  if (input.splitMethod === "PERCENTAGE") {
    const participants = input.participants!;
    const totalPct = participants.reduce((sum, p) => sum + (p.value ?? 0), 0);
    if (Math.abs(totalPct - 100) > 0.5) {
      throw ApiError.badRequest("Percentages must add up to 100");
    }
    const shares = splitByPercentage(input.amount, participants.map((p) => p.value!));
    return participants.map((p, i) => ({ userId: p.userId, share: shares[i], percentage: p.value }));
  }

  if (input.splitMethod === "EXACT") {
    const participants = input.participants!;
    const amounts = participants.map((p) => p.value!);
    if (!validateExactSplit(input.amount, amounts)) {
      throw ApiError.badRequest("Exact amounts must add up to the total expense amount");
    }
    return participants.map((p) => ({ userId: p.userId, share: new Decimal(p.value!).toDecimalPlaces(2) }));
  }

  if (input.splitMethod === "SHARES") {
    const participants = input.participants!;
    const shareWeights = participants.map((p) => p.value!);
    if (shareWeights.some((s) => s <= 0)) {
      throw ApiError.badRequest("Share weights must be greater than zero");
    }
    const shares = splitByShares(input.amount, shareWeights);
    return participants.map((p, i) => ({ userId: p.userId, share: shares[i], shares: p.value }));
  }

  return [];
}

export async function createExpense(roomId: string, createdById: string, input: CreateExpenseInput) {
  const payerIds = input.payers.map((p) => p.userId);
  const participantShares = computeShares(input);
  const participantIds = participantShares.map((p) => p.userId);

  await assertMembers(roomId, [...payerIds, ...participantIds]);

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || category.roomId !== roomId) {
      throw ApiError.badRequest("Invalid category for this room");
    }
  }

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        roomId,
        title: input.title,
        description: input.description,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        splitMethod: input.splitMethod,
        notes: input.notes,
        createdById,
        payers: {
          create: input.payers.map((p) => ({ userId: p.userId, amount: p.amount })),
        },
        participants: {
          create: participantShares.map((p) => ({
            userId: p.userId,
            share: p.share,
            percentage: p.percentage,
            shares: p.shares,
          })),
        },
      },
      include: { payers: true, participants: true, category: true },
    });

    await logActivity({
      roomId,
      actorId: createdById,
      action: "CREATE",
      entityType: "Expense",
      entityId: created.id,
      newValue: { title: created.title, amount: created.amount.toString() },
      tx,
    });

    return created;
  });

  const creator = await prisma.user.findUniqueOrThrow({ where: { id: createdById } });
  await notifyRoomMembers({
    roomId,
    excludeUserId: createdById,
    type: "EXPENSE_CREATED",
    title: "New expense added",
    body: `${creator.name} added "${expense.title}" for ${expense.amount.toString()}`,
    metadata: { expenseId: expense.id },
  });

  return expense;
}

export async function listExpenses(roomId: string, query: ListExpensesQuery) {
  const where: Prisma.ExpenseWhereInput = {
    roomId,
    status: query.status ?? { not: "DELETED" },
  };

  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.payerId) where.payers = { some: { userId: query.payerId } };
  if (query.search) where.title = { contains: query.search, mode: "insensitive" };
  if (query.dateFrom || query.dateTo) {
    where.date = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getExpense(roomId: string, expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      category: true,
      payers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      createdBy: { select: { id: true, name: true } },
      receipts: true,
    },
  });
  if (!expense || expense.roomId !== roomId || expense.status === "DELETED") {
    throw ApiError.notFound("Expense not found");
  }
  return expense;
}

export async function updateExpense(
  roomId: string,
  expenseId: string,
  actorId: string,
  input: CreateExpenseInput,
) {
  const existing = await getExpense(roomId, expenseId);

  const payerIds = input.payers.map((p) => p.userId);
  const participantShares = computeShares(input);
  const participantIds = participantShares.map((p) => p.userId);
  await assertMembers(roomId, [...payerIds, ...participantIds]);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.expensePayer.deleteMany({ where: { expenseId } });
    await tx.expenseParticipant.deleteMany({ where: { expenseId } });

    const result = await tx.expense.update({
      where: { id: expenseId },
      data: {
        title: input.title,
        description: input.description,
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        splitMethod: input.splitMethod,
        notes: input.notes,
        payers: { create: input.payers.map((p) => ({ userId: p.userId, amount: p.amount })) },
        participants: {
          create: participantShares.map((p) => ({
            userId: p.userId,
            share: p.share,
            percentage: p.percentage,
            shares: p.shares,
          })),
        },
      },
      include: { payers: true, participants: true, category: true },
    });

    await logActivity({
      roomId,
      actorId,
      action: "UPDATE",
      entityType: "Expense",
      entityId: expenseId,
      previousValue: { title: existing.title, amount: existing.amount.toString() },
      newValue: { title: result.title, amount: result.amount.toString() },
      tx,
    });

    return result;
  });

  await notifyRoomMembers({
    roomId,
    excludeUserId: actorId,
    type: "EXPENSE_UPDATED",
    title: "Expense updated",
    body: `"${updated.title}" was updated`,
    metadata: { expenseId },
  });

  return updated;
}

export async function archiveExpense(roomId: string, expenseId: string, actorId: string) {
  const existing = await getExpense(roomId, expenseId);

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  await logActivity({
    roomId,
    actorId,
    action: "ARCHIVE",
    entityType: "Expense",
    entityId: expenseId,
    previousValue: { status: existing.status },
    newValue: { status: "ARCHIVED" },
  });

  return updated;
}

export async function deleteExpense(roomId: string, expenseId: string, actorId: string) {
  await getExpense(roomId, expenseId);

  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: "DELETED", deletedAt: new Date() },
  });

  await logActivity({
    roomId,
    actorId,
    action: "DELETE",
    entityType: "Expense",
    entityId: expenseId,
  });

  await notifyRoomMembers({
    roomId,
    excludeUserId: actorId,
    type: "EXPENSE_DELETED",
    title: "Expense removed",
    body: "An expense was removed from the room",
    metadata: { expenseId },
  });
}
