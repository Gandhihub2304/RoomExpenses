"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Loader2, PiggyBank, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/form-field";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import {
  getCurrentBudget,
  upsertBudget,
  recordBudgetPayment,
  type BudgetSummary,
} from "@/lib/api/budget";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

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

      {budget.exists && budget.memberSplit.length > 0 && (
        <BudgetMemberSplitCard
          roomId={roomId}
          budget={budget}
          currency={currency}
          isAdmin={isAdmin}
          onUpdated={load}
        />
      )}

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

function BudgetMemberSplitCard({
  roomId,
  budget,
  currency,
  isAdmin,
  onUpdated,
}: {
  roomId: string;
  budget: BudgetSummary;
  currency: string;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const { user } = useAuth();
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function startEdit(memberUserId: string, currentPaid: string) {
    setEditingUserId(memberUserId);
    setEditValue(currentPaid);
  }

  async function handleSave(memberUserId: string) {
    if (!budget.id) return;
    setSaving(true);
    const result = await recordBudgetPayment(roomId, {
      budgetId: budget.id,
      userId: memberUserId,
      paidAmount: Number(editValue) || 0,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Contribution updated");
    setEditingUserId(null);
    onUpdated();
  }

  return (
    <Card className="py-5">
      <CardHeader className="px-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <p className="text-sm font-semibold">Split among roommates</p>
        </div>
        <p className="text-xs text-muted-foreground">
          The monthly budget divided equally — track what each person has paid.
        </p>
      </CardHeader>
      <CardContent className="px-5">
        <div className="divide-y divide-border/60">
          {budget.memberSplit.map((m) => {
            const canEdit = isAdmin || m.userId === user?.id;
            const isEditing = editingUserId === m.userId;
            const remaining = Number(m.remainingAmount);
            const isSettled = remaining <= 0.5;

            return (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.name}
                      {m.userId === user?.id && (
                        <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Share: {formatMoney(m.shareAmount, currency)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 w-28"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <Button size="icon-sm" disabled={saving} onClick={() => handleSave(m.userId)}>
                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatMoney(m.paidAmount, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">paid</p>
                      </div>
                      {isSettled ? (
                        <Badge className="bg-success/15 text-success" variant="secondary">
                          Settled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {formatMoney(m.remainingAmount, currency)} left
                        </Badge>
                      )}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(m.userId, m.paidAmount)}
                        >
                          Update
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
