"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Receipt, Search, Trash2, Pencil, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoom } from "@/lib/room-context";
import { listExpenses, deleteExpense, archiveExpense, type Expense } from "@/lib/api/expenses";
import { formatMoney, formatDate } from "@/lib/format";

export function ExpensesList({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const [expenses, setExpenses] = React.useState<Expense[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);

  const load = React.useCallback(async () => {
    const result = await listExpenses(roomId, { search: search || undefined, pageSize: 50 });
    if (result.ok) setExpenses(result.data);
  }, [roomId, search]);

  React.useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteExpense(roomId, deleteTarget.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Expense deleted");
    load();
  }

  async function handleArchive(expense: Expense) {
    const result = await archiveExpense(roomId, expense.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Expense archived");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            All expenses logged in {room?.name ?? "this room"}.
          </p>
        </div>
        <Button asChild>
          <Link href={`/r/${roomId}/expenses/new`}>
            <Plus />
            Add expense
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {expenses === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Receipt className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No expenses found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search ? "Try a different search term." : "Add your first expense to start tracking shared spending."}
          </p>
          {!search && (
            <Button className="mt-5" asChild>
              <Link href={`/r/${roomId}/expenses/new`}>
                <Plus />
                Add expense
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{expense.title}</p>
                    {expense.category && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                        style={{ backgroundColor: `${expense.category.color}1a`, color: expense.category.color }}
                      >
                        {expense.category.name}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paid by {expense.payers.map((p) => p.user.name).join(", ")} · {formatDate(expense.date)} ·{" "}
                    {expense.participants.length} {expense.participants.length === 1 ? "person" : "people"} split
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(expense.amount, currency)}
                  </span>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/r/${roomId}/expenses/${expense.id}/edit`} />}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(expense)}>
                          <Archive />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(expense)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this expense?"
        description={`"${deleteTarget?.title}" will be permanently removed and balances will be recalculated. This can't be undone.`}
        confirmLabel="Delete expense"
        onConfirm={handleDelete}
      />
    </div>
  );
}
