import { api } from "@/lib/api/client";

export interface GoalContribution {
  id: string;
  amount: string;
  month: number;
  year: number;
  note: string | null;
  createdAt: string;
  addedBy: { id: string; name: string };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  savedAmount: string;
  isActive: boolean;
  reachedAt: string | null;
  createdAt: string;
  contributions: GoalContribution[];
}

export interface SuggestedContribution {
  suggestedAmount: string;
  month: number;
  year: number;
  reason: "no_budget_set" | "leftover_budget";
}

export function getActiveGoal(roomId: string) {
  return api.get<Goal | null>(`/rooms/${roomId}/goals`);
}

export function getGoalHistory(roomId: string) {
  return api.get<Goal[]>(`/rooms/${roomId}/goals/history`);
}

export function getSuggestedContribution(roomId: string, month?: number, year?: number) {
  const qs = month && year ? `?month=${month}&year=${year}` : "";
  return api.get<SuggestedContribution>(`/rooms/${roomId}/goals/suggested-contribution${qs}`);
}

export function createGoal(roomId: string, input: { name: string; targetAmount: number }) {
  return api.post<Goal>(`/rooms/${roomId}/goals`, input);
}

export function addContribution(
  roomId: string,
  input: { amount: number; month: number; year: number; note?: string },
) {
  return api.post<Goal & { justReached: boolean }>(`/rooms/${roomId}/goals/contributions`, input);
}

export function completeGoal(roomId: string, goalId: string) {
  return api.post<Goal>(`/rooms/${roomId}/goals/${goalId}/complete`);
}

export function cancelGoal(roomId: string, goalId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/goals/${goalId}`);
}
