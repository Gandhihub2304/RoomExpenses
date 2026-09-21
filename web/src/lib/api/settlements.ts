import { api } from "@/lib/api/client";

export interface MemberBalance {
  userId: string;
  name: string;
  avatarUrl: string | null;
  balance: string;
}

export interface SuggestedSettlement {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: string;
}

export interface SettlementRecord {
  id: string;
  amount: string;
  status: "PENDING" | "PARTIALLY_PAID" | "SETTLED" | "CANCELLED";
  upiRef: string | null;
  paymentNote: string | null;
  settledAt: string | null;
  createdAt: string;
  fromUser: { id: string; name: string; avatarUrl: string | null };
  toUser: { id: string; name: string; avatarUrl: string | null };
}

export interface SettlementOverview {
  memberBalances: MemberBalance[];
  suggestedTransactions: SuggestedSettlement[];
  pendingSettlements: SettlementRecord[];
}

export function getSettlementOverview(roomId: string) {
  return api.get<SettlementOverview>(`/rooms/${roomId}/settlements`);
}

export function getSettlementHistory(roomId: string) {
  return api.get<SettlementRecord[]>(`/rooms/${roomId}/settlements/history`);
}

export function getMyBalance(roomId: string) {
  return api.get<{ balance: string }>(`/rooms/${roomId}/settlements/me`);
}

export function recordSettlement(
  roomId: string,
  input: { fromUserId: string; toUserId: string; amount: number; upiRef?: string; paymentNote?: string },
) {
  return api.post<SettlementRecord>(`/rooms/${roomId}/settlements`, input);
}

export function updateSettlementStatus(
  roomId: string,
  settlementId: string,
  status: "SETTLED" | "CANCELLED" | "PARTIALLY_PAID",
) {
  return api.patch<SettlementRecord>(`/rooms/${roomId}/settlements/${settlementId}`, { status });
}
