"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, PartyPopper, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/form-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoom } from "@/lib/room-context";
import {
  getActiveGoal,
  createGoal,
  addContribution,
  getSuggestedContribution,
  cancelGoal,
  type Goal,
} from "@/lib/api/goals";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoalUnlockCelebration } from "@/components/goals/goal-unlock-celebration";

export function GoalsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const isAdmin = room?.myRole === "ADMIN";
  const currency = room?.currency ?? "INR";

  const [goal, setGoal] = React.useState<Goal | null | undefined>(undefined);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [contributeOpen, setContributeOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [showCelebration, setShowCelebration] = React.useState(false);

  const load = React.useCallback(async () => {
    const result = await getActiveGoal(roomId);
    if (result.ok) setGoal(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCancel() {
    if (!goal) return;
    const result = await cancelGoal(roomId, goal.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Goal cancelled");
    load();
  }

  if (goal === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Room goal</h1>
          <p className="text-sm text-muted-foreground">
            Save up together for something the room wants.
          </p>
        </div>
        {isAdmin && !goal && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Set a goal
          </Button>
        )}
        {isAdmin && goal && !goal.reachedAt && (
          <Button onClick={() => setContributeOpen(true)}>
            <Sparkles />
            Add this month's contribution
          </Button>
        )}
      </div>

      {!goal ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Target className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No active goal</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {isAdmin
              ? "Set something the room is saving up for — a TV, a trip, new furniture. Leftover budget each month can go toward it."
              : "Your room admin hasn't set a savings goal yet."}
          </p>
        </div>
      ) : (
        <GoalDetail
          goal={goal}
          currency={currency}
          onReachedFirstView={() => setShowCelebration(true)}
          onCancel={() => setCancelOpen(true)}
          isAdmin={isAdmin}
        />
      )}

      {isAdmin && (
        <>
          <CreateGoalDialog
            roomId={roomId}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={load}
          />
          {goal && (
            <ContributeDialog
              roomId={roomId}
              currency={currency}
              open={contributeOpen}
              onOpenChange={setContributeOpen}
              onAdded={(justReached) => {
                load();
                if (justReached) setShowCelebration(true);
              }}
            />
          )}
          <ConfirmDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Cancel this goal?"
            description={`"${goal?.name}" will be archived. Contributions already saved are kept in history.`}
            confirmLabel="Cancel goal"
            onConfirm={handleCancel}
          />
        </>
      )}

      {showCelebration && goal && (
        <GoalUnlockCelebration goalName={goal.name} onDone={() => setShowCelebration(false)} />
      )}
    </div>
  );
}

function GoalDetail({
  goal,
  currency,
  onReachedFirstView,
  onCancel,
  isAdmin,
}: {
  goal: Goal;
  currency: string;
  onReachedFirstView: () => void;
  onCancel: () => void;
  isAdmin: boolean;
}) {
  const target = Number(goal.targetAmount);
  const saved = Number(goal.savedAmount);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const reached = !!goal.reachedAt;
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    const key = `goal-celebrated-${goal.id}`;
    if (reached && !shownRef.current && typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      shownRef.current = true;
      sessionStorage.setItem(key, "1");
      onReachedFirstView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reached, goal.id]);

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          "overflow-hidden border-none py-0",
          reached
            ? "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500"
            : "bg-gradient-to-br from-primary to-chart-4",
        )}
      >
        <CardContent className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground/90">
              {reached ? <PartyPopper className="size-4" /> : <Target className="size-4" />}
              <span className="text-sm font-medium">{reached ? "Goal unlocked!" : "In progress"}</span>
            </div>
            {isAdmin && (
              <button
                onClick={onCancel}
                className="rounded-md p-1 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
                title="Cancel goal"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary-foreground">{goal.name}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-primary-foreground">
            {formatMoney(saved, currency)}
            <span className="ml-1.5 text-base font-normal opacity-80">
              of {formatMoney(target, currency)}
            </span>
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-primary-foreground/90">
            {reached
              ? "You've saved enough — go get it! 🎉"
              : `${pct.toFixed(0)}% saved · ${formatMoney(Math.max(0, target - saved), currency)} to go`}
          </p>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <p className="text-sm font-semibold">Contribution history</p>
        </CardHeader>
        <CardContent className="px-4">
          {goal.contributions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No contributions yet.</p>
          ) : (
            <div className="space-y-3">
              {goal.contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">
                      {new Date(c.year, c.month - 1).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added by {c.addedBy.name} · {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-success">
                    +{formatMoney(c.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateGoalDialog({
  roomId,
  open,
  onOpenChange,
  onCreated,
}: {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || Number(targetAmount) <= 0) {
      toast.error("Enter a name and a valid target amount");
      return;
    }
    setSubmitting(true);
    const result = await createGoal(roomId, { name: name.trim(), targetAmount: Number(targetAmount) });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Goal set!");
    setName("");
    setTargetAmount("");
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set a room goal</DialogTitle>
          <DialogDescription>What is the room saving up for?</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField id="goal-name" label="Goal name">
            <Input id="goal-name" placeholder="New couch" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField id="goal-target" label="Target amount">
            <Input
              id="goal-target"
              type="number"
              min={0}
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Set goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContributeDialog({
  roomId,
  currency,
  open,
  onOpenChange,
  onAdded,
}: {
  roomId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (justReached: boolean) => void;
}) {
  const now = new Date();
  const [amount, setAmount] = React.useState("");
  const [loadingSuggestion, setLoadingSuggestion] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoadingSuggestion(true);
    getSuggestedContribution(roomId).then((result) => {
      setLoadingSuggestion(false);
      if (result.ok) setAmount(result.data.suggestedAmount);
    });
  }, [open, roomId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(amount) <= 0) {
      toast.error("Enter a contribution amount greater than zero");
      return;
    }
    setSubmitting(true);
    const result = await addContribution(roomId, {
      amount: Number(amount),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Contribution added");
    onOpenChange(false);
    onAdded(result.data.justReached);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add this month's contribution</DialogTitle>
          <DialogDescription>
            Suggested from leftover budget — adjust if you'd like to add more or less.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField id="contribution-amount" label={`Amount (${currency})`}>
            <Input
              id="contribution-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              disabled={loadingSuggestion}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>
          <DialogFooter>
            <Button type="submit" disabled={submitting || loadingSuggestion}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Add contribution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
