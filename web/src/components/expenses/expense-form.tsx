"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoom } from "@/lib/room-context";
import { listMembers, type RoomMemberDetail } from "@/lib/api/members";
import {
  listCategories,
  createExpense,
  updateExpense,
  getExpense,
  type ExpenseCategory,
  type CreateExpenseInput,
} from "@/lib/api/expenses";
import { cn } from "@/lib/utils";

const SPLIT_METHODS = [
  { value: "EQUAL", label: "Equal" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "EXACT", label: "Exact amount" },
  { value: "SHARES", label: "Shares" },
  { value: "PAYER_ONLY", label: "Payer only" },
] as const;
type SplitMethod = (typeof SPLIT_METHODS)[number]["value"];

export function ExpenseForm({ roomId, expenseId }: { roomId: string; expenseId?: string }) {
  const router = useRouter();
  const { room } = useRoom();
  const currency = room?.currency ?? "INR";
  const isEditing = !!expenseId;

  const [members, setMembers] = React.useState<RoomMemberDetail[]>([]);
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [splitMethod, setSplitMethod] = React.useState<SplitMethod>("EQUAL");
  const [notes, setNotes] = React.useState("");
  const [payerId, setPayerId] = React.useState<string>("");
  const [participantIds, setParticipantIds] = React.useState<Set<string>>(new Set());
  const [customValues, setCustomValues] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const [membersRes, categoriesRes] = await Promise.all([
        listMembers(roomId),
        listCategories(roomId),
      ]);
      if (membersRes.ok) {
        setMembers(membersRes.data);
        const allIds = new Set(membersRes.data.map((m) => m.userId));
        setParticipantIds(allIds);
      }
      if (categoriesRes.ok) setCategories(categoriesRes.data);

      if (expenseId) {
        const expenseRes = await getExpense(roomId, expenseId);
        if (expenseRes.ok) {
          const e = expenseRes.data;
          setTitle(e.title);
          setDescription(e.description ?? "");
          setAmount(e.amount);
          setCategoryId(e.category?.id ?? "");
          setDate(e.date.slice(0, 10));
          setSplitMethod(e.splitMethod);
          setNotes(e.notes ?? "");
          setPayerId(e.payers[0]?.user.id ?? "");
          setParticipantIds(new Set(e.participants.map((p) => p.user.id)));
          const values: Record<string, string> = {};
          for (const p of e.participants) {
            if (e.splitMethod === "PERCENTAGE" && p.percentage) values[p.user.id] = p.percentage;
            if (e.splitMethod === "EXACT") values[p.user.id] = p.share;
            if (e.splitMethod === "SHARES" && p.shares) values[p.user.id] = String(p.shares);
          }
          setCustomValues(values);
        }
      } else if (membersRes.ok) {
        // Default payer to the current user if present, else first member.
        setPayerId(membersRes.data[0]?.userId ?? "");
      }
      setLoaded(true);
    }
    load();
  }, [roomId, expenseId]);

  function toggleParticipant(userId: string) {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const selectedParticipants = members.filter((m) => participantIds.has(m.userId));
  const numericAmount = Number(amount) || 0;

  const percentageTotal = selectedParticipants.reduce(
    (sum, m) => sum + (Number(customValues[m.userId]) || 0),
    0,
  );
  const exactTotal = selectedParticipants.reduce(
    (sum, m) => sum + (Number(customValues[m.userId]) || 0),
    0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return toast.error("Enter a title for this expense");
    if (numericAmount <= 0) return toast.error("Enter an amount greater than zero");
    if (!payerId) return toast.error("Select who paid");
    if (splitMethod !== "PAYER_ONLY" && selectedParticipants.length === 0) {
      return toast.error("Select at least one participant");
    }
    if (splitMethod === "PERCENTAGE" && Math.abs(percentageTotal - 100) > 0.5) {
      return toast.error("Percentages must add up to 100");
    }
    if (splitMethod === "EXACT" && Math.abs(exactTotal - numericAmount) > 0.01) {
      return toast.error("Exact amounts must add up to the total");
    }

    const payload: CreateExpenseInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      amount: numericAmount,
      categoryId: categoryId || undefined,
      date: new Date(date).toISOString(),
      splitMethod,
      notes: notes.trim() || undefined,
      payers: [{ userId: payerId, amount: numericAmount }],
    };

    if (splitMethod === "EQUAL") {
      payload.participantIds = selectedParticipants.map((m) => m.userId);
    } else if (splitMethod !== "PAYER_ONLY") {
      payload.participants = selectedParticipants.map((m) => ({
        userId: m.userId,
        value: Number(customValues[m.userId]) || 0,
      }));
    }

    setSubmitting(true);
    const result = expenseId
      ? await updateExpense(roomId, expenseId, payload)
      : await createExpense(roomId, payload);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(isEditing ? "Expense updated" : "Expense added");
    router.push(`/r/${roomId}/expenses`);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/r/${roomId}/expenses`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to expenses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {isEditing ? "Edit expense" : "Add expense"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="title" label="Title" className="sm:col-span-2">
            <Input id="title" placeholder="Electricity bill" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>

          <FormField id="amount" label={`Amount (${currency})`}>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>

          <FormField id="date" label="Date">
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>

          <FormField id="category" label="Category (optional)">
            <select
              id="category"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="payer" label="Paid by">
            <select
              id="payer"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              <option value="" disabled>
                Select payer
              </option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <Label className="mb-2 block">Split method</Label>
          <Tabs value={splitMethod} onValueChange={(v) => setSplitMethod(v as SplitMethod)}>
            <TabsList className="flex-wrap">
              {SPLIT_METHODS.map((m) => (
                <TabsTrigger key={m.value} value={m.value}>
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {splitMethod !== "PAYER_ONLY" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Split with</Label>
              {splitMethod === "PERCENTAGE" && (
                <span className={cn("text-xs font-medium", Math.abs(percentageTotal - 100) > 0.5 ? "text-destructive" : "text-success")}>
                  {percentageTotal.toFixed(1)}% of 100%
                </span>
              )}
              {splitMethod === "EXACT" && (
                <span className={cn("text-xs font-medium", Math.abs(exactTotal - numericAmount) > 0.01 ? "text-destructive" : "text-success")}>
                  {exactTotal.toFixed(2)} of {numericAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              {members.map((m) => {
                const checked = participantIds.has(m.userId);
                return (
                  <div key={m.userId} className="flex items-center gap-3">
                    <Checkbox
                      id={`participant-${m.userId}`}
                      checked={checked}
                      onCheckedChange={() => toggleParticipant(m.userId)}
                    />
                    <label htmlFor={`participant-${m.userId}`} className="flex-1 text-sm">
                      {m.user.name}
                    </label>
                    {checked && splitMethod !== "EQUAL" && (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 w-24"
                        placeholder={splitMethod === "PERCENTAGE" ? "%" : splitMethod === "SHARES" ? "shares" : "amount"}
                        value={customValues[m.userId] ?? ""}
                        onChange={(e) =>
                          setCustomValues((prev) => ({ ...prev, [m.userId]: e.target.value }))
                        }
                      />
                    )}
                    {checked && splitMethod === "EQUAL" && numericAmount > 0 && (
                      <span className="w-24 text-right text-xs text-muted-foreground">
                        {(numericAmount / selectedParticipants.length).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <FormField id="notes" label="Notes (optional)">
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Save changes" : "Add expense"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/r/${roomId}/expenses`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
