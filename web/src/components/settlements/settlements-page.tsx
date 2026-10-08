"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MonthPicker } from "@/components/room/month-picker";
import { BudgetMemberSplitList } from "@/components/budget/budget-member-split";
import { useRoom } from "@/lib/room-context";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { getBudgetForMonth, type BudgetSummary } from "@/lib/api/budget";
import { formatMoney } from "@/lib/format";

export function SettlementsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [budget, setBudget] = React.useState<BudgetSummary | null>(null);

  const load = React.useCallback(async () => {
    const result = await getBudgetForMonth(roomId, month, year);
    if (result.ok) setBudget(result.data);
  }, [roomId, month, year]);

  React.useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load);

  function changeMonth(m: number, y: number) {
    setBudget(null);
    setMonth(m);
    setYear(y);
  }

  const totals = React.useMemo(() => {
    const split = budget?.memberSplit ?? [];
    const sum = (key: "paidAmount" | "expensePaidAmount" | "contributedAmount" | "remainingAmount") =>
      split.reduce((acc, m) => acc + Number(m[key]), 0);
    return {
      cash: sum("paidAmount"),
      expenses: sum("expensePaidAmount"),
      contributed: sum("contributedAmount"),
      remaining: sum("remainingAmount"),
    };
  }, [budget]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Each roommate&apos;s share of the monthly budget — what they&apos;ve put in and what&apos;s left.
          </p>
        </div>
        <MonthPicker month={month} year={year} onChange={changeMonth} />
      </div>

      {!budget ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !budget.exists ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <PiggyBank className="size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No budget for this month yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {isAdmin
              ? "Set a monthly budget and it will be split equally between all roommates here."
              : "Once your admin sets this month's budget, your share and what's left to pay will show here."}
          </p>
          {isAdmin && (
            <Button className="mt-5" asChild>
              <Link href={`/r/${roomId}/budget`}>Set budget</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <Card className="py-5">
            <CardContent className="space-y-4 px-5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold tabular-nums">{formatMoney(budget.totalAmount ?? 0, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contributed</p>
                  <p className="text-lg font-semibold tabular-nums text-success">{formatMoney(totals.contributed, currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Still due</p>
                  <p className="text-lg font-semibold tabular-nums text-destructive">{formatMoney(totals.remaining, currency)}</p>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{
                    width: `${Math.min(100, (totals.contributed / Math.max(1, Number(budget.totalAmount))) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatMoney(totals.cash, currency)} paid directly · {formatMoney(totals.expenses, currency)} paid through
                room expenses. Expenses you pay for the room count toward your share.
              </p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardHeader className="px-5">
              <p className="text-sm font-semibold">Roommates</p>
              <p className="text-xs text-muted-foreground">
                {budget.memberSplit.length} {budget.memberSplit.length === 1 ? "person" : "people"} ·{" "}
                {formatMoney(budget.memberSplit[0]?.shareAmount ?? 0, currency)} each
              </p>
            </CardHeader>
            <CardContent className="px-5">
              <BudgetMemberSplitList
                roomId={roomId}
                budget={budget}
                currency={currency}
                isAdmin={isAdmin}
                onUpdated={load}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
