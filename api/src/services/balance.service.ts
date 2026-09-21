import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { simplifyDebts } from "@/utils/settlement-engine";

/**
 * Computes each member's net balance in a room:
 * positive = the room owes them money, negative = they owe the room.
 * Derived from (amount paid on active expenses) - (share owed on active expenses),
 * adjusted by settled settlement transactions.
 */
export async function computeRoomBalances(roomId: string): Promise<Map<string, Decimal>> {
  const balances = new Map<string, Decimal>();

  const memberships = await prisma.roomMembership.findMany({
    where: { roomId, status: { in: ["ACTIVE", "SUSPENDED"] } },
    select: { userId: true },
  });
  for (const m of memberships) balances.set(m.userId, new Decimal(0));

  const expenses = await prisma.expense.findMany({
    where: { roomId, status: "ACTIVE" },
    include: { payers: true, participants: true },
  });

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      const current = balances.get(payer.userId) ?? new Decimal(0);
      balances.set(payer.userId, current.plus(payer.amount));
    }
    for (const participant of expense.participants) {
      const current = balances.get(participant.userId) ?? new Decimal(0);
      balances.set(participant.userId, current.minus(participant.share));
    }
  }

  const settlements = await prisma.settlement.findMany({
    where: { roomId, status: "SETTLED" },
  });

  for (const settlement of settlements) {
    const fromBalance = balances.get(settlement.fromUserId) ?? new Decimal(0);
    const toBalance = balances.get(settlement.toUserId) ?? new Decimal(0);
    // The debtor already paid this amount to the creditor outside the expense ledger.
    balances.set(settlement.fromUserId, fromBalance.plus(settlement.amount));
    balances.set(settlement.toUserId, toBalance.minus(settlement.amount));
  }

  return balances;
}

export async function getRoomBalanceSummary(roomId: string) {
  const balances = await computeRoomBalances(roomId);
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(balances.keys()) } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const memberBalances = Array.from(balances.entries()).map(([userId, amount]) => ({
    userId,
    name: userMap.get(userId)?.name ?? "Unknown",
    avatarUrl: userMap.get(userId)?.avatarUrl ?? null,
    balance: amount.toDecimalPlaces(2).toString(),
  }));

  const suggestedTransactions = simplifyDebts(balances).map((t) => ({
    fromUserId: t.fromUserId,
    fromName: userMap.get(t.fromUserId)?.name ?? "Unknown",
    toUserId: t.toUserId,
    toName: userMap.get(t.toUserId)?.name ?? "Unknown",
    amount: t.amount.toString(),
  }));

  return { memberBalances, suggestedTransactions };
}

export async function getUserBalance(roomId: string, userId: string) {
  const balances = await computeRoomBalances(roomId);
  return (balances.get(userId) ?? new Decimal(0)).toDecimalPlaces(2).toString();
}
