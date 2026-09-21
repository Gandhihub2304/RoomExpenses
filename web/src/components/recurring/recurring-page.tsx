"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Repeat, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import {
  listRecurring,
  createRecurring,
  generateRecurringNow,
  deleteRecurring,
  type RecurringExpenseItem,
} from "@/lib/api/recurring";
import { formatMoney, formatDate } from "@/lib/format";

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export function RecurringPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const { user } = useAuth();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const [items, setItems] = React.useState<RecurringExpenseItem[] | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<RecurringExpenseItem | null>(null);
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [frequency, setFrequency] = React.useState<(typeof FREQUENCIES)[number]>("MONTHLY");
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = React.useState(false);
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const result = await listRecurring(roomId);
    if (result.ok) setItems(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || Number(amount) <= 0 || !user) {
      toast.error("Enter a title and a valid amount");
      return;
    }
    setSubmitting(true);
    const result = await createRecurring(roomId, {
      title: title.trim(),
      amount: Number(amount),
      frequency,
      splitMethod: "EQUAL",
      startDate: new Date(startDate).toISOString(),
      payerId: user.id,
      autoCreate: true,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Recurring expense created");
    setTitle("");
    setAmount("");
    setDialogOpen(false);
    load();
  }

  async function handleGenerateNow(item: RecurringExpenseItem) {
    setGeneratingId(item.id);
    const result = await generateRecurringNow(roomId, item.id);
    setGeneratingId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Expense created from this template");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteRecurring(roomId, deleteTarget.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Recurring expense removed");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recurring expenses</h1>
          <p className="text-sm text-muted-foreground">
            Rent, utilities, and subscriptions that repeat automatically.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus />
            Add recurring expense
          </Button>
        )}
      </div>

      {items === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Repeat className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No recurring expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set up rent or bills to repeat automatically.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{item.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {item.frequency.charAt(0) + item.frequency.slice(1).toLowerCase()}
                    </Badge>
                    {!item.isActive && (
                      <Badge variant="destructive" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Next due {formatDate(item.nextDueDate)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatMoney(item.amount, currency)}</span>
                  {isAdmin && (
                    <>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title="Generate now"
                        disabled={generatingId === item.id}
                        onClick={() => handleGenerateNow(item)}
                      >
                        {generatingId === item.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Zap className="size-4" />
                        )}
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add recurring expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField id="recurring-title" label="Title">
              <Input id="recurring-title" placeholder="Rent" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField id="recurring-amount" label={`Amount (${currency})`}>
              <Input
                id="recurring-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormField>
            <FormField id="recurring-frequency" label="Frequency">
              <select
                id="recurring-frequency"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="recurring-start" label="Start date">
              <Input id="recurring-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this recurring expense?"
        description={`"${deleteTarget?.title}" will no longer be created automatically. Past expenses it already generated are kept.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
}
