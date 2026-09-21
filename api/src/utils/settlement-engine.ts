import { Decimal } from "@prisma/client/runtime/library";

export interface SimplifiedTransaction {
  fromUserId: string;
  toUserId: string;
  amount: Decimal;
}

/**
 * Given each user's net balance (positive = owed to them, negative = they owe),
 * computes the minimum set of transactions that settles all debts.
 * Greedy algorithm: repeatedly match the largest creditor with the largest debtor.
 */
export function simplifyDebts(balances: Map<string, Decimal>): SimplifiedTransaction[] {
  const creditors: { userId: string; amount: Decimal }[] = [];
  const debtors: { userId: string; amount: Decimal }[] = [];

  for (const [userId, balance] of balances.entries()) {
    const rounded = balance.toDecimalPlaces(2);
    if (rounded.greaterThan(0.005)) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded.lessThan(-0.005)) {
      debtors.push({ userId, amount: rounded.abs() });
    }
  }

  creditors.sort((a, b) => b.amount.comparedTo(a.amount));
  debtors.sort((a, b) => b.amount.comparedTo(a.amount));

  const transactions: SimplifiedTransaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Decimal.min(debtor.amount, creditor.amount);

    if (amount.greaterThan(0.005)) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: amount.toDecimalPlaces(2),
      });
    }

    debtor.amount = debtor.amount.minus(amount);
    creditor.amount = creditor.amount.minus(amount);

    if (debtor.amount.lessThanOrEqualTo(0.005)) i++;
    if (creditor.amount.lessThanOrEqualTo(0.005)) j++;
  }

  return transactions;
}
