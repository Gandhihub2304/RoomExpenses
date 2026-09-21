import Link from "next/link";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoommateDashboardData } from "@/lib/api/dashboard";
import { formatMoney, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function RoommateDashboardView({
  data,
  roomId,
}: {
  data: RoommateDashboardData;
  roomId: string;
}) {
  const { user } = useAuth();
  const currency = data.room.currency;
  const balance = Number(data.myBalance);
  const isOwed = balance > 0;
  const isEven = Math.abs(balance) < 0.5;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hi {user?.name?.split(" ")[0]},</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening in {data.room.name}</p>
        </div>
        <Button asChild>
          <Link href={`/r/${roomId}/expenses/new`}>Add expense</Link>
        </Button>
      </div>

      <Card className="overflow-hidden border-none py-0 bg-primary text-primary-foreground">
        <CardContent className="px-6 py-6">
          <p className="text-sm text-primary-foreground/80">Your balance</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoney(Math.abs(balance), currency)}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/80">
            {isEven ? "You're all settled up" : isOwed ? "owed to you" : "you owe the room"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="gap-2 py-4">
          <CardHeader className="flex-row items-center justify-between px-4">
            <span className="text-xs font-medium text-muted-foreground">You paid (this month)</span>
            <ArrowUpFromLine className="size-4 text-success" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-xl font-semibold tabular-nums">
              {formatMoney(data.myPaidThisMonth, currency)}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="flex-row items-center justify-between px-4">
            <span className="text-xs font-medium text-muted-foreground">Your share (this month)</span>
            <ArrowDownToLine className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-xl font-semibold tabular-nums">
              {formatMoney(data.myShareThisMonth, currency)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 gap-2 py-4 lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between px-4">
            <span className="text-xs font-medium text-muted-foreground">Pending settlements</span>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-xl font-semibold tabular-nums">{data.myPendingSettlements.length}</div>
          </CardContent>
        </Card>
      </div>

      {data.myPendingSettlements.length > 0 && (
        <Card className="py-4">
          <CardHeader className="px-4">
            <p className="text-sm font-semibold">Your pending settlements</p>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            {data.myPendingSettlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {s.fromUser.name} → {s.toUser.name}
                </span>
                <span className="font-semibold tabular-nums">{formatMoney(s.amount, currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="py-4">
        <CardHeader className="flex-row items-center justify-between px-4">
          <p className="text-sm font-semibold">Room expenses</p>
          <Link href={`/r/${roomId}/expenses`} className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="px-4">
          {data.recentExpenses.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Receipt className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No expenses yet in this room.</p>
            </div>
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
    </div>
  );
}
