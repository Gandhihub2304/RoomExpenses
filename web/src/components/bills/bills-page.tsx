"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, FileClock, Loader2, Plus, Trash2 } from "lucide-react";
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
import { listBills, createBill, markBillPaid, deleteBill, type Bill } from "@/lib/api/bills";
import { formatMoney, formatDate } from "@/lib/format";

const STATUS_STYLE: Record<Bill["status"], string> = {
  UPCOMING: "bg-secondary text-secondary-foreground",
  DUE: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  OVERDUE: "bg-destructive/15 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function BillsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const [bills, setBills] = React.useState<Bill[] | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Bill | null>(null);
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    const result = await listBills(roomId);
    if (result.ok) setBills(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || Number(amount) <= 0) {
      toast.error("Enter a title and a valid amount");
      return;
    }
    setSubmitting(true);
    const result = await createBill(roomId, {
      title: title.trim(),
      amount: Number(amount),
      dueDate: new Date(dueDate).toISOString(),
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Bill added");
    setTitle("");
    setAmount("");
    setDialogOpen(false);
    load();
  }

  async function handleMarkPaid(bill: Bill) {
    const result = await markBillPaid(roomId, bill.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Bill marked as paid");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteBill(roomId, deleteTarget.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Bill deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
          <p className="text-sm text-muted-foreground">
            Upcoming and paid bills for {room?.name ?? "this room"}.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus />
            Add bill
          </Button>
        )}
      </div>

      {bills === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <FileClock className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No bills yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add rent, utilities, or subscriptions to track due dates.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{bill.title}</p>
                  <p className="text-sm text-muted-foreground">Due {formatDate(bill.dueDate)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatMoney(bill.amount, currency)}</span>
                  <Badge className={STATUS_STYLE[bill.status]} variant="secondary">
                    {bill.status.charAt(0) + bill.status.slice(1).toLowerCase()}
                  </Badge>
                  {isAdmin && bill.status !== "PAID" && (
                    <Button size="icon-sm" variant="ghost" onClick={() => handleMarkPaid(bill)} title="Mark as paid">
                      <CheckCircle2 className="size-4 text-success" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(bill)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
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
            <DialogTitle>Add a bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField id="bill-title" label="Title">
              <Input id="bill-title" placeholder="Internet" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField id="bill-amount" label={`Amount (${currency})`}>
              <Input
                id="bill-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormField>
            <FormField id="bill-due" label="Due date">
              <Input id="bill-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Add bill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this bill?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
