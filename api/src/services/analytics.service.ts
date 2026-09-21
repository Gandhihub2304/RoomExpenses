import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export async function getAnalytics(roomId: string, months = 6) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const expenses = await prisma.expense.findMany({
    where: { roomId, status: "ACTIVE", date: { gte: rangeStart } },
    include: {
      category: true,
      payers: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  // Monthly trend
  const monthlyMap = new Map<string, Decimal>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    monthlyMap.set(`${d.getFullYear()}-${d.getMonth() + 1}`, new Decimal(0));
  }
  for (const e of expenses) {
    const key = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, monthlyMap.get(key)!.plus(e.amount));
    }
  }
  const monthlyTrend = Array.from(monthlyMap.entries()).map(([key, total]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      total: total.toString(),
    };
  });

  // Category distribution (all time within range)
  const categoryMap = new Map<string, { name: string; color: string; total: Decimal }>();
  for (const e of expenses) {
    const key = e.category?.id ?? "uncategorized";
    const entry = categoryMap.get(key) ?? {
      name: e.category?.name ?? "Uncategorized",
      color: e.category?.color ?? "#64748b",
      total: new Decimal(0),
    };
    entry.total = entry.total.plus(e.amount);
    categoryMap.set(key, entry);
  }
  const categoryDistribution = Array.from(categoryMap.values())
    .map((c) => ({ name: c.name, color: c.color, total: c.total.toString() }))
    .sort((a, b) => Number(b.total) - Number(a.total));

  // Payer-wise spending
  const payerMap = new Map<string, { name: string; total: Decimal }>();
  for (const e of expenses) {
    for (const p of e.payers) {
      const entry = payerMap.get(p.userId) ?? { name: p.user.name, total: new Decimal(0) };
      entry.total = entry.total.plus(p.amount);
      payerMap.set(p.userId, entry);
    }
  }
  const payerBreakdown = Array.from(payerMap.entries())
    .map(([userId, v]) => ({ userId, name: v.name, total: v.total.toString() }))
    .sort((a, b) => Number(b.total) - Number(a.total));

  const totalSpend = expenses.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
  const avgMonthly = totalSpend.div(months);
  const highestExpense = expenses.reduce(
    (max, e) => (e.amount.greaterThan(max?.amount ?? 0) ? e : max),
    null as (typeof expenses)[number] | null,
  );

  const thisMonthTotal = monthlyTrend[monthlyTrend.length - 1]?.total ?? "0";
  const lastMonthTotal = monthlyTrend[monthlyTrend.length - 2]?.total ?? "0";
  const momChange =
    Number(lastMonthTotal) > 0
      ? ((Number(thisMonthTotal) - Number(lastMonthTotal)) / Number(lastMonthTotal)) * 100
      : null;

  return {
    monthlyTrend,
    categoryDistribution,
    payerBreakdown,
    totalSpend: totalSpend.toString(),
    avgMonthlySpend: avgMonthly.toDecimalPlaces(2).toString(),
    highestExpense: highestExpense
      ? { title: highestExpense.title, amount: highestExpense.amount.toString(), date: highestExpense.date }
      : null,
    monthOverMonthChangePct: momChange,
  };
}
