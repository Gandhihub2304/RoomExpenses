import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { getRoomBalanceSummary, getUserBalance } from "@/services/balance.service";

function monthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function resolveMonthYear(month?: number, year?: number) {
  const now = new Date();
  return {
    month: month ?? now.getMonth() + 1,
    year: year ?? now.getFullYear(),
  };
}

export async function getAdminDashboard(roomId: string, month?: number, year?: number) {
  const resolved = resolveMonthYear(month, year);
  const { start: monthStart, end: monthEnd } = monthRange(resolved.month, resolved.year);

  const [
    room,
    totalExpensesAgg,
    monthExpensesAgg,
    memberCount,
    pendingSettlements,
    upcomingBills,
    overdueBills,
    categoryBreakdown,
    monthExpenses,
    recentActivity,
    balanceSummary,
  ] = await Promise.all([
    prisma.room.findUniqueOrThrow({ where: { id: roomId } }),
    prisma.expense.aggregate({
      where: { roomId, status: "ACTIVE" },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.roomMembership.count({ where: { roomId, status: "ACTIVE" } }),
    prisma.settlement.count({ where: { roomId, status: { in: ["PENDING", "PARTIALLY_PAID"] } } }),
    prisma.bill.findMany({
      where: { roomId, status: { in: ["UPCOMING", "DUE"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.bill.count({ where: { roomId, status: "OVERDUE" } }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      take: 8,
      include: {
        category: true,
        payers: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.activityLog.findMany({
      where: { roomId, createdAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { id: true, name: true } } },
    }),
    getRoomBalanceSummary(roomId),
  ]);

  const categoryIds = categoryBreakdown.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const monthlySpend = monthExpensesAgg._sum.amount ?? new Decimal(0);
  const budgetUtilizationPct = room.monthlyBudget
    ? Math.min(100, monthlySpend.div(room.monthlyBudget).mul(100).toNumber())
    : null;

  return {
    selectedMonth: resolved.month,
    selectedYear: resolved.year,
    room: {
      id: room.id,
      name: room.name,
      currency: room.currency,
      monthlyBudget: room.monthlyBudget?.toString() ?? null,
    },
    totalExpenses: (totalExpensesAgg._sum.amount ?? new Decimal(0)).toString(),
    monthlySpend: monthlySpend.toString(),
    remainingBudget: room.monthlyBudget
      ? room.monthlyBudget.minus(monthlySpend).toString()
      : null,
    budgetUtilizationPct,
    memberCount,
    pendingSettlements,
    upcomingBills,
    overdueBillsCount: overdueBills,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId ? categoryMap.get(c.categoryId)?.name ?? "Uncategorized" : "Uncategorized",
      color: c.categoryId ? categoryMap.get(c.categoryId)?.color ?? "#64748b" : "#64748b",
      total: (c._sum.amount ?? new Decimal(0)).toString(),
    })),
    recentExpenses: monthExpenses,
    recentActivity,
    memberBalances: balanceSummary.memberBalances,
    suggestedSettlements: balanceSummary.suggestedTransactions,
  };
}

export async function getRoommateDashboard(
  roomId: string,
  userId: string,
  month?: number,
  year?: number,
) {
  const resolved = resolveMonthYear(month, year);
  const { start: monthStart, end: monthEnd } = monthRange(resolved.month, resolved.year);

  const [
    room,
    myBalance,
    myExpensesPaid,
    myExpenseShare,
    monthExpenses,
    myPendingSettlements,
    categoryBreakdown,
  ] = await Promise.all([
    prisma.room.findUniqueOrThrow({ where: { id: roomId } }),
    getUserBalance(roomId, userId),
    prisma.expensePayer.aggregate({
      where: { userId, expense: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } } },
      _sum: { amount: true },
    }),
    prisma.expenseParticipant.aggregate({
      where: { userId, expense: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } } },
      _sum: { share: true },
    }),
    prisma.expense.findMany({
      where: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "desc" },
      take: 8,
      include: {
        category: true,
        payers: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.settlement.findMany({
      where: {
        roomId,
        status: { in: ["PENDING", "PARTIALLY_PAID"] },
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { roomId, status: "ACTIVE", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const categoryIds = categoryBreakdown.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return {
    selectedMonth: resolved.month,
    selectedYear: resolved.year,
    room: {
      id: room.id,
      name: room.name,
      currency: room.currency,
    },
    myBalance,
    myPaidThisMonth: (myExpensesPaid._sum.amount ?? new Decimal(0)).toString(),
    myShareThisMonth: (myExpenseShare._sum.share ?? new Decimal(0)).toString(),
    recentExpenses: monthExpenses,
    myPendingSettlements,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId ? categoryMap.get(c.categoryId)?.name ?? "Uncategorized" : "Uncategorized",
      color: c.categoryId ? categoryMap.get(c.categoryId)?.color ?? "#64748b" : "#64748b",
      total: (c._sum.amount ?? new Decimal(0)).toString(),
    })),
  };
}
