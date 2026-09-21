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
  paidAmount: string;
  remainingAmount: string;
}

export interface BudgetSummary {
  exists: boolean;
  id?: string;
  month: number;
  year: number;
  totalAmount: string | null;
  warningPct: number;
  totalSpend: string;
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

export function upsertBudget(roomId: string, input: UpsertBudgetInput) {
  return api.put<BudgetSummary>(`/rooms/${roomId}/budget`, input);
}

export function recordBudgetPayment(
  roomId: string,
  input: { budgetId: string; userId: string; paidAmount: number },
) {
  return api.post<BudgetSummary>(`/rooms/${roomId}/budget/payments`, input);
}
