import { api } from "@/lib/api/client";

export interface ExpensePayer {
  user: { id: string; name: string; avatarUrl: string | null };
  amount: string;
}

export interface ExpenseParticipant {
  user: { id: string; name: string; avatarUrl: string | null };
  share: string;
  percentage: string | null;
  shares: number | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  date: string;
  splitMethod: "EQUAL" | "PERCENTAGE" | "EXACT" | "SHARES" | "PAYER_ONLY";
  status: string;
  notes: string | null;
  category: ExpenseCategory | null;
  payers: ExpensePayer[];
  participants: ExpenseParticipant[];
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListExpensesParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  payerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

function toQuery(params: object) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export async function listExpenses(roomId: string, params: ListExpensesParams = {}) {
  const result = await api.get<Expense[]>(`/rooms/${roomId}/expenses${toQuery(params)}`);
  return result;
}

export interface CreateExpensePayer {
  userId: string;
  amount: number;
}
export interface CreateExpenseParticipant {
  userId: string;
  value?: number;
}
export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  categoryId?: string;
  date?: string;
  splitMethod: "EQUAL" | "PERCENTAGE" | "EXACT" | "SHARES" | "PAYER_ONLY";
  notes?: string;
  payers: CreateExpensePayer[];
  participantIds?: string[];
  participants?: CreateExpenseParticipant[];
}

export function createExpense(roomId: string, input: CreateExpenseInput) {
  return api.post<Expense>(`/rooms/${roomId}/expenses`, input);
}

export function updateExpense(roomId: string, expenseId: string, input: CreateExpenseInput) {
  return api.put<Expense>(`/rooms/${roomId}/expenses/${expenseId}`, input);
}

export function getExpense(roomId: string, expenseId: string) {
  return api.get<Expense>(`/rooms/${roomId}/expenses/${expenseId}`);
}

export function archiveExpense(roomId: string, expenseId: string) {
  return api.post<Expense>(`/rooms/${roomId}/expenses/${expenseId}/archive`);
}

export function deleteExpense(roomId: string, expenseId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/expenses/${expenseId}`);
}

export function listCategories(roomId: string) {
  return api.get<ExpenseCategory[]>(`/rooms/${roomId}/categories`);
}
