"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, HandCoins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import {
  getSettlementOverview,
  recordSettlement,
  updateSettlementStatus,
  type SettlementOverview,
} from "@/lib/api/settlements";
import { formatMoney, formatDate } from "@/lib/format";

export function SettlementsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const { user } = useAuth();
  const currency = room?.currency ?? "INR";
  const [data, setData] = React.useState<SettlementOverview | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const result = await getSettlementOverview(roomId);
    if (result.ok) setData(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleRecordPayment(fromUserId: string, toUserId: string, amount: number) {
    setBusyId(`${fromUserId}-${toUserId}`);
    const result = await recordSettlement(roomId, { fromUserId, toUserId, amount });
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Payment recorded. Waiting for confirmation.");
    load();
  }

  async function handleConfirm(settlementId: string) {
    setBusyId(settlementId);
    const result = await updateSettlementStatus(roomId, settlementId, "SETTLED");
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Settlement confirmed");
    load();
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
        <p className="text-sm text-muted-foreground">
          Who owes whom in {room?.name ?? "this room"} — simplified to the fewest payments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.memberBalances.map((m) => {
          const balance = Number(m.balance);
          const isMe = m.userId === user?.id;
          return (
            <Card key={m.userId} className="gap-2 py-4">
              <CardHeader className="px-4">
                <p className="text-sm font-medium">
                  {m.name}
                  {isMe && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                </p>
              </CardHeader>
              <CardContent className="px-4">
                <p
                  className={`text-lg font-semibold tabular-nums ${
                    balance > 0.5 ? "text-success" : balance < -0.5 ? "text-destructive" : ""
                  }`}
                >
                  {formatMoney(Math.abs(balance), currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(balance) < 0.5 ? "settled up" : balance > 0 ? "is owed" : "owes the room"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="py-4">
        <CardHeader className="px-4">
          <p className="text-sm font-semibold">Suggested settlements</p>
          <p className="text-xs text-muted-foreground">
            The minimum number of payments needed to settle everyone up.
          </p>
        </CardHeader>
        <CardContent className="px-4">
          {data.suggestedTransactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="size-8 text-success" />
              <p className="mt-3 text-sm text-muted-foreground">Everyone is settled up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.suggestedTransactions.map((s, i) => {
                const canPay = s.fromUserId === user?.id;
                const key = `${s.fromUserId}-${s.toUserId}`;
                return (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="truncate font-medium">{s.fromName}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{s.toName}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatMoney(s.amount, currency)}</span>
                      {canPay && (
                        <Button
                          size="sm"
                          disabled={busyId === key}
                          onClick={() => handleRecordPayment(s.fromUserId, s.toUserId, Number(s.amount))}
                        >
                          {busyId === key && <Loader2 className="size-3.5 animate-spin" />}
                          Mark as paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="px-4">
          <p className="text-sm font-semibold">Pending confirmation</p>
        </CardHeader>
        <CardContent className="px-4">
          {data.pendingSettlements.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <HandCoins className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No pending settlements.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.pendingSettlements.map((s) => {
                const canConfirm = s.toUser.id === user?.id || room?.myRole === "ADMIN";
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{s.fromUser.name}</span> paid{" "}
                        <span className="font-medium">{s.toUser.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold tabular-nums">{formatMoney(s.amount, currency)}</span>
                      <Badge variant="secondary">Pending</Badge>
                      {canConfirm && (
                        <Button size="sm" variant="outline" disabled={busyId === s.id} onClick={() => handleConfirm(s.id)}>
                          {busyId === s.id && <Loader2 className="size-3.5 animate-spin" />}
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
