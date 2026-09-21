import { api } from "@/lib/api/client";

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  color: string;
  total: string;
}

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

export interface AdminDashboardData {
  viewerRole: "ADMIN";
  selectedMonth: number;
  selectedYear: number;
  room: { id: string; name: string; currency: string; monthlyBudget: string | null };
  totalExpenses: string;
  monthlySpend: string;
  remainingBudget: string | null;
  budgetUtilizationPct: number | null;
  memberCount: number;
  pendingSettlements: number;
  upcomingBills: { id: string; title: string; amount: string; dueDate: string }[];
  overdueBillsCount: number;
  categoryBreakdown: CategoryBreakdown[];
  recentExpenses: {
    id: string;
    title: string;
    amount: string;
    date: string;
    category: { name: string; color: string } | null;
    payers: { user: { id: string; name: string }; amount: string }[];
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { name: string };
  }[];
  memberBalances: MemberBalance[];
  suggestedSettlements: SuggestedSettlement[];
}

export interface RoommateDashboardData {
  viewerRole: "ROOMMATE";
  selectedMonth: number;
  selectedYear: number;
  room: { id: string; name: string; currency: string };
  myBalance: string;
  myPaidThisMonth: string;
  myShareThisMonth: string;
  recentExpenses: AdminDashboardData["recentExpenses"];
  myPendingSettlements: {
    id: string;
    amount: string;
    status: string;
    fromUser: { id: string; name: string };
    toUser: { id: string; name: string };
  }[];
  categoryBreakdown: CategoryBreakdown[];
}

export type DashboardData = AdminDashboardData | RoommateDashboardData;

export function getDashboard(roomId: string, month?: number, year?: number) {
  const qs = month && year ? `?month=${month}&year=${year}` : "";
  return api.get<DashboardData>(`/rooms/${roomId}/dashboard${qs}`);
}
