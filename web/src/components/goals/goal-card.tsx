"use client";

import * as React from "react";
import Link from "next/link";
import { PartyPopper, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getActiveGoal, type Goal } from "@/lib/api/goals";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function GoalCard({ roomId, currency }: { roomId: string; currency: string }) {
  const [goal, setGoal] = React.useState<Goal | null | undefined>(undefined);

  React.useEffect(() => {
    getActiveGoal(roomId).then((result) => {
      if (result.ok) setGoal(result.data);
    });
  }, [roomId]);

  if (goal === undefined) return null;

  if (!goal) {
    return (
      <Link href={`/r/${roomId}/goals`} className="block">
        <Card className="py-4 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-3 px-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
              <Target className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">No room goal yet</p>
              <p className="text-xs text-muted-foreground">Set something to save up for together</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const target = Number(goal.targetAmount);
  const saved = Number(goal.savedAmount);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const reached = !!goal.reachedAt;

  return (
    <Link href={`/r/${roomId}/goals`} className="block">
      <Card
        className={cn(
          "overflow-hidden border-none py-0 transition-shadow hover:shadow-lg",
          reached
            ? "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500"
            : "bg-gradient-to-br from-primary to-chart-4",
        )}
      >
        <CardHeader className="flex-row items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2 text-primary-foreground">
            {reached ? <PartyPopper className="size-4" /> : <Target className="size-4" />}
            <p className="text-sm font-medium opacity-90">Room goal</p>
          </div>
          {reached && (
            <span className="animate-bounce rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
              Unlocked!
            </span>
          )}
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-lg font-semibold text-primary-foreground">{goal.name}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary-foreground">
            {formatMoney(saved, currency)}
            <span className="ml-1 text-sm font-normal opacity-80">
              / {formatMoney(target, currency)}
            </span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-primary-foreground/85">
            {reached ? "You've unlocked your goal — you can buy it now!" : `${pct.toFixed(0)}% saved so far`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
