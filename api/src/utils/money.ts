import { Decimal } from "@prisma/client/runtime/library";

/** Rounds to 2 decimal places using standard rounding (banker's rounding avoided for money clarity). */
export function round2(value: Decimal | number | string): Decimal {
  return new Decimal(value).toDecimalPlaces(2);
}

/**
 * Splits `total` into `count` shares of 2-decimal money values that sum
 * exactly to `total` — remainder cents are distributed to the first N
 * participants so no paisa is lost or invented.
 */
export function splitEqually(total: Decimal | number | string, count: number): Decimal[] {
  if (count <= 0) return [];
  const totalDecimal = new Decimal(total);
  const totalCents = totalDecimal.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const baseCents = totalCents.div(count).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  const remainder = totalCents.minus(baseCents.mul(count)).toNumber();

  return Array.from({ length: count }, (_, i) => {
    const cents = baseCents.plus(i < remainder ? 1 : 0);
    return cents.div(100).toDecimalPlaces(2);
  });
}

/**
 * Splits `total` by percentage weights (must sum to 100). Distributes
 * rounding remainder cents to the largest shares first for fairness.
 */
export function splitByPercentage(total: Decimal | number | string, percentages: number[]): Decimal[] {
  const totalDecimal = new Decimal(total);
  const totalCents = totalDecimal.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

  const rawCents = percentages.map((pct) => totalCents.mul(pct).div(100));
  const flooredCents = rawCents.map((c) => c.toDecimalPlaces(0, Decimal.ROUND_DOWN));
  const distributed = flooredCents.reduce((sum, c) => sum.plus(c), new Decimal(0));
  let remainder = totalCents.minus(distributed).toNumber();

  const remainders = rawCents.map((c, i) => ({ i, frac: c.minus(flooredCents[i]).toNumber() }));
  remainders.sort((a, b) => b.frac - a.frac);

  const result = [...flooredCents];
  for (let k = 0; k < remainder && k < remainders.length; k++) {
    result[remainders[k].i] = result[remainders[k].i].plus(1);
  }

  return result.map((c) => c.div(100).toDecimalPlaces(2));
}

/** Splits `total` by integer shares/weights (e.g. 2 shares vs 1 share). */
export function splitByShares(total: Decimal | number | string, shares: number[]): Decimal[] {
  const totalShares = shares.reduce((a, b) => a + b, 0);
  if (totalShares <= 0) return shares.map(() => new Decimal(0));
  const percentages = shares.map((s) => (s / totalShares) * 100);
  return splitByPercentage(total, percentages);
}

/** Validates that exact-amount splits sum to the expense total (within 1 paisa tolerance). */
export function validateExactSplit(total: Decimal | number | string, amounts: (Decimal | number | string)[]) {
  const totalDecimal = new Decimal(total);
  const sum = amounts.reduce((acc: Decimal, a) => acc.plus(new Decimal(a)), new Decimal(0));
  return sum.minus(totalDecimal).abs().lessThanOrEqualTo(0.01);
}
