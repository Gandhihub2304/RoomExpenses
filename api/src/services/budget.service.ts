import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers, notifyUser } from "@/services/notification.service";
import { splitEqually } from "@/utils/money";
import type { UpsertBudgetInput, RecordBudgetPaymentInput } from "@/validators/budget";

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Divides `totalAmount` equally across the room's active members. Each
 * member's contribution is the money they handed over (paidAmount) plus
 * every room expense they paid for out of their own pocket during the budget
 * month. Expenses paid with room money (funding = ROOM) come out of what was
 * already collected, so they don't count as anyone's contribution.
 */
async function getMemberSplit(
  roomId: string,
  budgetId: string | null,
  totalAmount: Decimal | null,
  range: { start: Date; end: Date },
  excludeExpenseId?: string,
) {
  const [members, payments, expensePaid] = await Promise.all([
    prisma.roomMembership.findMany({
      where: { roomId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    budgetId ? prisma.budgetMemberPayment.findMany({ where: { budgetId } }) : [],
    prisma.expensePayer.groupBy({
      by: ["userId"],
      where: {
        expense: {
          roomId,
          status: "ACTIVE",
          funding: "PERSONAL",
          date: { gte: range.start, lte: range.end },
          ...(excludeExpenseId ? { id: { not: excludeExpenseId } } : {}),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const paymentMap = new Map(payments.map((p) => [p.userId, p.paidAmount]));
  const expenseMap = new Map(expensePaid.map((e) => [e.userId, e._sum.amount ?? new Decimal(0)]));
  const shares =
    totalAmount && members.length > 0 ? splitEqually(totalAmount, members.length) : null;

  return members.map((m, i) => {
    const share = shares?.[i] ?? new Decimal(0);
    const paid = paymentMap.get(m.userId) ?? new Decimal(0);
    const expenses = expenseMap.get(m.userId) ?? new Decimal(0);
    const contributed = paid.plus(expenses);
    const remaining = share.minus(contributed);
    return {
      userId: m.userId,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      shareAmount: share.toString(),
      paidAmount: paid.toString(),
      expensePaidAmount: expenses.toString(),
      contributedAmount: contributed.toString(),
      remainingAmount: (remaining.greaterThan(0) ? remaining : new Decimal(0)).toString(),
      extraAmount: (remaining.lessThan(0) ? remaining.abs() : new Decimal(0)).toString(),
    };
  });
}

/**
 * Members (from `userIds`) who have NOT yet covered their share of the budget
 * for the month containing `date`. Used to decide whether an expense may be
 * paid with room money. Returns all of them when that month has no budget.
 */
export async function membersWithShareDue(
  roomId: string,
  date: Date,
  userIds: string[],
  excludeExpenseId?: string,
) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const budget = await prisma.budget.findUnique({
    where: { roomId_month_year: { roomId, month, year } },
  });
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  if (!budget) return { budgetExists: false, due: users };

  const split = await getMemberSplit(roomId, budget.id, budget.totalAmount, monthRange(year, month), excludeExpenseId);
  const dueIds = new Set(
    split.filter((m) => new Decimal(m.remainingAmount).greaterThan(0.5)).map((m) => m.userId),
  );
  return { budgetExists: true, due: users.filter((u) => dueIds.has(u.id)) };
}

export async function getCurrentBudget(roomId: string) {
  const now = new Date();
  return getBudgetForMonth(roomId, now.getMonth() + 1, now.getFullYear());
}

export async function getBudgetForMonth(roomId: string, month: number, year: number) {
  const budget = await prisma.budget.findUnique({
    where: { roomId_month_year: { roomId, month, year } },
    include: { categories: { include: { category: true } } },
  });

  const { start, end } = monthRange(year, month);
  const spendByCategory = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { roomId, status: "ACTIVE", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  const totalSpendAgg = await prisma.expense.aggregate({
    where: { roomId, status: "ACTIVE", date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const spendMap = new Map(spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? new Decimal(0)]));
  const totalSpend = totalSpendAgg._sum.amount ?? new Decimal(0);

  if (!budget) {
    const memberSplit = await getMemberSplit(roomId, null, null, { start, end });
    return {
      exists: false,
      month,
      year,
      totalAmount: null,
      warningPct: 80,
      totalSpend: totalSpend.toString(),
      utilizationPct: null,
      categories: [],
      memberSplit,
    };
  }

  const utilizationPct = budget.totalAmount.greaterThan(0)
    ? totalSpend.div(budget.totalAmount).mul(100).toNumber()
    : 0;

  const [memberSplit, roomFundedAgg] = await Promise.all([
    getMemberSplit(roomId, budget.id, budget.totalAmount, { start, end }),
    prisma.expense.aggregate({
      where: { roomId, status: "ACTIVE", funding: "ROOM", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);
  // The room "pot" is the cash members handed over; room-money expenses are
  // paid out of it.
  const cashCollected = memberSplit.reduce((sum, m) => sum.plus(m.paidAmount), new Decimal(0));
  const roomFundedSpend = roomFundedAgg._sum.amount ?? new Decimal(0);

  return {
    exists: true,
    id: budget.id,
    month,
    year,
    totalAmount: budget.totalAmount.toString(),
    warningPct: budget.warningPct,
    totalSpend: totalSpend.toString(),
    cashCollected: cashCollected.toString(),
    roomFundedSpend: roomFundedSpend.toString(),
    roomMoneyLeft: cashCollected.minus(roomFundedSpend).toString(),
    utilizationPct,
    categories: budget.categories.map((bc) => ({
      categoryId: bc.categoryId,
      categoryName: bc.category.name,
      color: bc.category.color,
      budgeted: bc.amount.toString(),
      spent: (spendMap.get(bc.categoryId) ?? new Decimal(0)).toString(),
    })),
    memberSplit,
  };
}

export async function recordMemberPayment(
  roomId: string,
  actorId: string,
  actorRole: "ADMIN" | "ROOMMATE",
  input: RecordBudgetPaymentInput,
) {
  const budget = await prisma.budget.findUnique({ where: { id: input.budgetId } });
  if (!budget || budget.roomId !== roomId) throw ApiError.notFound("Budget not found");

  // A roommate can only record their own payment; an admin can record for anyone.
  if (actorRole !== "ADMIN" && actorId !== input.userId) {
    throw ApiError.forbidden("You can only record your own contribution");
  }

  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId, userId: input.userId } },
  });
  if (!membership || membership.status !== "ACTIVE") {
    throw ApiError.badRequest("That person isn't an active member of this room");
  }

  const payment = await prisma.budgetMemberPayment.upsert({
    where: { budgetId_userId: { budgetId: budget.id, userId: input.userId } },
    update: { paidAmount: input.paidAmount },
    create: { budgetId: budget.id, userId: input.userId, paidAmount: input.paidAmount },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "BudgetMemberPayment",
    entityId: payment.id,
    newValue: { userId: input.userId, paidAmount: input.paidAmount },
  });

  if (actorId !== input.userId) {
    await notifyUser({
      userId: input.userId,
      roomId,
      type: "PAYMENT_CONFIRMED",
      title: "Budget contribution recorded",
      body: `Your budget contribution was updated to ${payment.paidAmount.toString()}`,
    });
  }

  return getBudgetForMonth(roomId, budget.month, budget.year);
}

export async function upsertBudget(roomId: string, actorId: string, input: UpsertBudgetInput) {
  const budget = await prisma.$transaction(async (tx) => {
    const upserted = await tx.budget.upsert({
      where: { roomId_month_year: { roomId, month: input.month, year: input.year } },
      update: { totalAmount: input.totalAmount, warningPct: input.warningPct },
      create: {
        roomId,
        month: input.month,
        year: input.year,
        totalAmount: input.totalAmount,
        warningPct: input.warningPct,
      },
    });

    await tx.budgetCategory.deleteMany({ where: { budgetId: upserted.id } });
    if (input.categories.length > 0) {
      await tx.budgetCategory.createMany({
        data: input.categories.map((c) => ({
          budgetId: upserted.id,
          categoryId: c.categoryId,
          amount: c.amount,
        })),
      });
    }

    await logActivity({
      roomId,
      actorId,
      action: "UPDATE",
      entityType: "Budget",
      entityId: upserted.id,
      newValue: { month: input.month, year: input.year, totalAmount: input.totalAmount },
      tx,
    });

    return upserted;
  });

  return getBudgetForMonth(roomId, input.month, input.year);
}

export async function checkBudgetWarning(roomId: string) {
  const summary = await getCurrentBudget(roomId);
  if (!summary.exists || summary.utilizationPct === null) return;

  if (summary.utilizationPct >= 100) {
    await notifyRoomMembers({
      roomId,
      type: "BUDGET_EXCEEDED",
      title: "Budget exceeded",
      body: `Room spending has exceeded this month's budget of ${summary.totalAmount}`,
    });
  } else if (summary.utilizationPct >= summary.warningPct) {
    await notifyRoomMembers({
      roomId,
      type: "BUDGET_WARNING",
      title: "Approaching budget limit",
      body: `Room spending has reached ${summary.utilizationPct.toFixed(0)}% of this month's budget`,
    });
  }
}
