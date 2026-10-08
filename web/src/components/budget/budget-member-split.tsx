"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { recordBudgetPayment, type BudgetMemberSplit, type BudgetSummary } from "@/lib/api/budget";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

type EditMode = { userId: string; mode: "add" | "set" };

export function BudgetMemberSplitList({
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
  const [editing, setEditing] = React.useState<EditMode | null>(null);
  const [value, setValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function open(member: BudgetMemberSplit, mode: EditMode["mode"]) {
    setEditing({ userId: member.userId, mode });
    setValue(mode === "set" ? String(Number(member.paidAmount)) : "");
  }

  async function save(member: BudgetMemberSplit) {
    if (!budget.id || !editing) return;
    const entered = Number(value);
    if (!Number.isFinite(entered) || entered < 0 || (editing.mode === "add" && entered === 0)) {
      toast.error("Enter a valid amount");
      return;
    }
    const newPaid = editing.mode === "add" ? Number(member.paidAmount) + entered : entered;
    setSaving(true);
    const result = await recordBudgetPayment(roomId, {
      budgetId: budget.id,
      userId: member.userId,
      paidAmount: Math.round(newPaid * 100) / 100,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(editing.mode === "add" ? "Payment added" : "Payment updated");
    setEditing(null);
    onUpdated();
  }

  return (
    <div className="divide-y divide-border/60">
      {budget.memberSplit.map((m) => {
        const share = Number(m.shareAmount);
        const contributed = Number(m.contributedAmount);
        const remaining = Number(m.remainingAmount);
        const extra = Number(m.extraAmount);
        const pct = share > 0 ? Math.min(100, (contributed / share) * 100) : 0;
        const isMe = m.userId === user?.id;
        const canEdit = isAdmin || isMe;
        const isEditing = editing?.userId === m.userId;

        return (
          <div key={m.userId} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {isMe && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Share {formatMoney(share, currency)}</p>
                </div>
              </div>
              {remaining <= 0.5 ? (
                <Badge variant="secondary" className="shrink-0 bg-success/15 text-success">
                  {extra > 0.5 ? `Settled · +${formatMoney(extra, currency)} extra` : "Settled"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0 bg-destructive/10 text-destructive">
                  {formatMoney(remaining, currency)} due
                </Badge>
              )}
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", remaining <= 0.5 ? "bg-success" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Paid</p>
                <p className={cn("font-medium tabular-nums", Number(m.paidAmount) > 0 && "text-success")}>
                  {formatMoney(m.paidAmount, currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expenses paid</p>
                <p className={cn("font-medium tabular-nums", Number(m.expensePaidAmount) > 0 && "text-success")}>
                  {formatMoney(m.expensePaidAmount, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">{extra > 0.5 ? "Extra paid" : "Remaining"}</p>
                <p
                  className={cn(
                    "font-semibold tabular-nums",
                    extra > 0.5 ? "text-success" : remaining > 0.5 ? "text-destructive" : "text-success",
                  )}
                >
                  {extra > 0.5 ? `+${formatMoney(extra, currency)}` : formatMoney(remaining, currency)}
                </p>
              </div>
            </div>

            {canEdit && budget.id && (
              <div className="mt-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      className="h-8 max-w-40"
                      placeholder={editing.mode === "add" ? "Amount paid now" : "Total paid"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && save(m)}
                      autoFocus
                    />
                    <Button size="sm" disabled={saving} onClick={() => save(m)}>
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      {editing.mode === "add" ? "Add" : "Save"}
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Cancel" onClick={() => setEditing(null)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {remaining > 0.5 && (
                      <Button size="sm" variant="outline" onClick={() => open(m, "add")}>
                        <Plus className="size-3.5" />
                        Add payment
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => open(m, "set")}>
                        <Pencil className="size-3.5" />
                        Correct paid amount
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
