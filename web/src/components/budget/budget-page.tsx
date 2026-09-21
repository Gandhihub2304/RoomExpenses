"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, PiggyBank, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { useRoom } from "@/lib/room-context";
import { getCurrentBudget, upsertBudget, type BudgetSummary } from "@/lib/api/budget";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BudgetPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const [budget, setBudget] = React.useState<BudgetSummary | null>(null);
  const [totalAmount, setTotalAmount] = React.useState("");
  const [warningPct, setWarningPct] = React.useState("80");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const result = await getCurrentBudget(roomId);
    if (result.ok) {
      setBudget(result.data);
      setTotalAmount(result.data.totalAmount ?? "");
      setWarningPct(String(result.data.warningPct));
    }
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!budget || Number(totalAmount) <= 0) {
      toast.error("Enter a valid budget amount");
      return;
    }
    setSaving(true);
    const now = new Date();
    const result = await upsertBudget(roomId, {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalAmount: Number(totalAmount),
      warningPct: Number(warningPct),
      categories: [],
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Budget saved");
    load();
  }

  if (!budget) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const utilization = budget.utilizationPct ?? 0;
  const isOverWarning = utilization >= budget.warningPct;
  const isOver = utilization >= 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="text-sm text-muted-foreground">
          This month's spending limit for {room?.name ?? "this room"}.
        </p>
      </div>

      <Card className="py-5">
        <CardHeader className="px-5">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-4 text-primary" />
            <p className="text-sm font-semibold">Current month</p>
          </div>
        </CardHeader>
        <CardContent className="px-5">
          {budget.exists ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatMoney(budget.totalSpend, currency)}
                </span>
                <span className="text-sm text-muted-foreground">
                  of {formatMoney(budget.totalAmount ?? 0, currency)}
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isOver ? "bg-destructive" : isOverWarning ? "bg-warning" : "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {utilization.toFixed(0)}% used
                {isOver
                  ? " — budget exceeded"
                  : isOverWarning
                    ? ` — approaching your ${budget.warningPct}% warning threshold`
                    : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No budget set for this month yet. Spent so far: {formatMoney(budget.totalSpend, currency)}
            </p>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="py-5">
          <CardHeader className="px-5">
            <p className="text-sm font-semibold">
              {budget.exists ? "Update budget" : "Set a budget"}
            </p>
          </CardHeader>
          <CardContent className="px-5">
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <FormField id="total-amount" label={`Monthly budget (${currency})`}>
                <Input
                  id="total-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </FormField>
              <FormField id="warning-pct" label="Warning threshold (%)">
                <Input
                  id="warning-pct"
                  type="number"
                  min={1}
                  max={100}
                  value={warningPct}
                  onChange={(e) => setWarningPct(e.target.value)}
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
                  Save budget
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
