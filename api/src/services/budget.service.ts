import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import type { UpsertBudgetInput } from "@/validators/budget";

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
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
    return {
      exists: false,
      month,
      year,
      totalAmount: null,
      warningPct: 80,
      totalSpend: totalSpend.toString(),
      utilizationPct: null,
      categories: [],
    };
  }

  const utilizationPct = budget.totalAmount.greaterThan(0)
    ? totalSpend.div(budget.totalAmount).mul(100).toNumber()
    : 0;

  return {
    exists: true,
    id: budget.id,
    month,
    year,
    totalAmount: budget.totalAmount.toString(),
    warningPct: budget.warningPct,
    totalSpend: totalSpend.toString(),
    utilizationPct,
    categories: budget.categories.map((bc) => ({
      categoryId: bc.categoryId,
      categoryName: bc.category.name,
      color: bc.category.color,
      budgeted: bc.amount.toString(),
      spent: (spendMap.get(bc.categoryId) ?? new Decimal(0)).toString(),
    })),
  };
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
