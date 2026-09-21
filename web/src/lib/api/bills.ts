import { api } from "@/lib/api/client";
import type { ExpenseCategory } from "@/lib/api/expenses";

export interface Bill {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  status: "UPCOMING" | "DUE" | "PAID" | "OVERDUE" | "CANCELLED";
  category: ExpenseCategory | null;
  createdBy: { id: string; name: string };
  paidAt: string | null;
  receiptUrl: string | null;
}

export interface CreateBillInput {
  title: string;
  amount: number;
  categoryId?: string;
  dueDate: string;
}

export function listBills(roomId: string) {
  return api.get<Bill[]>(`/rooms/${roomId}/bills`);
}

export function createBill(roomId: string, input: CreateBillInput) {
  return api.post<Bill>(`/rooms/${roomId}/bills`, input);
}

export function markBillPaid(roomId: string, billId: string) {
  return api.post<Bill>(`/rooms/${roomId}/bills/${billId}/pay`, {});
}

export function deleteBill(roomId: string, billId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/bills/${billId}`);
}
