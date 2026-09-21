import { api } from "@/lib/api/client";
import type { ExpenseCategory } from "@/lib/api/expenses";

export interface RecurringExpenseItem {
  id: string;
  title: string;
  amount: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  splitMethod: string;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  autoCreate: boolean;
  category: ExpenseCategory | null;
  createdBy: { id: string; name: string };
}

export interface CreateRecurringInput {
  title: string;
  amount: number;
  categoryId?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  splitMethod: "EQUAL" | "PERCENTAGE" | "EXACT" | "SHARES" | "PAYER_ONLY";
  startDate: string;
  payerId: string;
  autoCreate: boolean;
}

export function listRecurring(roomId: string) {
  return api.get<RecurringExpenseItem[]>(`/rooms/${roomId}/recurring-expenses`);
}

export function createRecurring(roomId: string, input: CreateRecurringInput) {
  return api.post<RecurringExpenseItem>(`/rooms/${roomId}/recurring-expenses`, input);
}

export function generateRecurringNow(roomId: string, recurringId: string) {
  return api.post(`/rooms/${roomId}/recurring-expenses/${recurringId}/generate`);
}

export function deleteRecurring(roomId: string, recurringId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/recurring-expenses/${recurringId}`);
}
