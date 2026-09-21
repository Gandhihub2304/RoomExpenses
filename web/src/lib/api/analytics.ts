import { api } from "@/lib/api/client";

export interface AnalyticsData {
  monthlyTrend: { label: string; total: string }[];
  categoryDistribution: { name: string; color: string; total: string }[];
  payerBreakdown: { userId: string; name: string; total: string }[];
  totalSpend: string;
  avgMonthlySpend: string;
  highestExpense: { title: string; amount: string; date: string } | null;
  monthOverMonthChangePct: number | null;
}

export function getAnalytics(roomId: string, months = 6) {
  return api.get<AnalyticsData>(`/rooms/${roomId}/analytics?months=${months}`);
}
