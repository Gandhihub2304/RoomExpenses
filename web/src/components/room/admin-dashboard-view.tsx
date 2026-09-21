import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  AlertCircle,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDashboardData } from "@/lib/api/dashboard";
import { formatMoney, formatDate, relativeTime } from "@/lib/format";
import { GoalCard } from "@/components/goals/goal-card";

function StatCard({
  label,
  value,
  icon: Icon,
  caption,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  caption?: string;
  tone?: "warning" | "destructive";
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex-row items-center justify-between px-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon
          className={`size-4 ${
            tone === "warning"
              ? "text-warning"
              : tone === "destructive"
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        />
      </CardHeader>
      <CardContent className="px-4">
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardView({
  data,
  roomId,
  monthPicker,
  loading,
}: {
  data: AdminDashboardData;
  roomId: string;
  onRefresh: () => void;
  monthPicker: React.ReactNode;
  loading?: boolean;
}) {
  const currency = data.room.currency;

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.room.name}</h1>
          <p className="text-sm text-muted-foreground">Admin dashboard overview</p>
        </div>
        <div className="flex items-center gap-2">
          {monthPicker}
          <Button asChild>
            <Link href={`/r/${roomId}/expenses/new`}>Add expense</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total room spending" value={formatMoney(data.totalExpenses, currency)} icon={Wallet} />
        <StatCard label="Selected month" value={formatMoney(data.monthlySpend, currency)} icon={TrendingUp} />
        <StatCard
          label="Pending settlements"
          value={String(data.pendingSettlements)}
          icon={Users}
          caption={`${data.memberCount} roommates`}
        />
        <StatCard
          label="Overdue bills"
          value={String(data.overdueBillsCount)}
          icon={AlertCircle}
          tone={data.overdueBillsCount > 0 ? "destructive" : undefined}
        />
      </div>

      {data.room.monthlyBudget && (
        <Card className="py-4">
          <CardHeader className="flex-row items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="size-4 text-primary" />
              <p className="text-sm font-semibold">Budget utilization</p>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {data.budgetUtilizationPct?.toFixed(0)}%
            </span>
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  (data.budgetUtilizationPct ?? 0) >= 90 ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, data.budgetUtilizationPct ?? 0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatMoney(data.monthlySpend, currency)} of {formatMoney(data.room.monthlyBudget, currency)} spent
              {data.remainingBudget && ` · ${formatMoney(data.remainingBudget, currency)} remaining`}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="py-4 lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between px-4">
            <p className="text-sm font-semibold">Expenses this month</p>
            <Link href={`/r/${roomId}/expenses`} className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-4">
            {data.recentExpenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this month.</p>
            ) : (
              <div className="space-y-3">
                {data.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.payers.map((p) => p.user.name).join(", ")} · {formatDate(expense.date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {expense.category && (
                        <Badge variant="secondary" className="text-xs">
                          {expense.category.name}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(expense.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-4 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between px-4">
            <p className="text-sm font-semibold">Spending by category</p>
            <Link href={`/r/${roomId}/analytics`} className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-4">
            {data.categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No spending in this month.</p>
            ) : (
              <div className="space-y-3">
                {data.categoryBreakdown
                  .slice()
                  .sort((a, b) => Number(b.total) - Number(a.total))
                  .map((cat) => {
                    const monthTotal = data.categoryBreakdown.reduce((s, c) => s + Number(c.total), 0);
                    const pct = monthTotal > 0 ? (Number(cat.total) / monthTotal) * 100 : 0;
                    return (
                      <div key={cat.categoryId ?? "none"}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate">{cat.categoryName}</span>
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">
                            {formatMoney(cat.total, currency)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <GoalCard roomId={roomId} currency={currency} />
        </div>

        <Card className="py-4 lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between px-4">
            <p className="text-sm font-semibold">Recent activity</p>
            <Link href={`/r/${roomId}/activity`} className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-4">
            {data.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">
                      <span className="font-medium text-foreground">{log.actor.name}</span>{" "}
                      {log.action.toLowerCase()}d a {log.entityType.toLowerCase()}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
