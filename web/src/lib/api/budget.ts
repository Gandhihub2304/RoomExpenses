import { api } from "@/lib/api/client";

export interface BudgetCategoryLine {
  categoryId: string;
  categoryName: string;
  color: string;
  budgeted: string;
  spent: string;
}

export interface BudgetMemberSplit {
  userId: string;
  name: string;
  avatarUrl: string | null;
  shareAmount: string;
  /** Money handed over toward the budget (recorded by hand). */
  paidAmount: string;
  /** Room expenses this member paid for during the budget month. */
  expensePaidAmount: string;
  /** paidAmount + expensePaidAmount */
  contributedAmount: string;
  remainingAmount: string;
  /** How much they've contributed beyond their share. */
  extraAmount: string;
}

export interface BudgetSummary {
  exists: boolean;
  id?: string;
  month: number;
  year: number;
  totalAmount: string | null;
  warningPct: number;
  totalSpend: string;
  /** Cash members handed over toward the budget (only when the budget exists). */
  cashCollected?: string;
  /** Expenses paid out of that collected cash. */
  roomFundedSpend?: string;
  roomMoneyLeft?: string;
  utilizationPct: number | null;
  categories: BudgetCategoryLine[];
  memberSplit: BudgetMemberSplit[];
}

export interface UpsertBudgetInput {
  month: number;
  year: number;
  totalAmount: number;
  warningPct: number;
  categories: { categoryId: string; amount: number }[];
}

export function getCurrentBudget(roomId: string) {
  return api.get<BudgetSummary>(`/rooms/${roomId}/budget`);
}

export function getBudgetForMonth(roomId: string, month: number, year: number) {
  return api.get<BudgetSummary>(`/rooms/${roomId}/budget?month=${month}&year=${year}`);
}

export function upsertBudget(roomId: string, input: UpsertBudgetInput) {
  return api.put<BudgetSummary>(`/rooms/${roomId}/budget`, input);
}

export function recordBudgetPayment(
  roomId: string,
  input: { budgetId: string; userId: string; paidAmount: number },
) {
  return api.post<BudgetSummary>(`/rooms/${roomId}/budget/payments`, input);
}
