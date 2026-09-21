"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRoom } from "@/lib/room-context";
import { getAnalytics, type AnalyticsData } from "@/lib/api/analytics";
import { formatMoney, formatDate } from "@/lib/format";

export function AnalyticsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const currency = room?.currency ?? "INR";
  const [data, setData] = React.useState<AnalyticsData | null>(null);

  React.useEffect(() => {
    getAnalytics(roomId).then((result) => {
      if (result.ok) setData(result.data);
    });
  }, [roomId]);

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const chartData = data.monthlyTrend.map((m) => ({ label: m.label, total: Number(m.total) }));
  const pieData = data.categoryDistribution.map((c) => ({ name: c.name, value: Number(c.total), color: c.color }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Spending trends and breakdowns for {room?.name ?? "this room"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <span className="text-xs font-medium text-muted-foreground">Total spend (6mo)</span>
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-lg font-semibold tabular-nums">{formatMoney(data.totalSpend, currency)}</div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <span className="text-xs font-medium text-muted-foreground">Avg. monthly</span>
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-lg font-semibold tabular-nums">{formatMoney(data.avgMonthlySpend, currency)}</div>
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <span className="text-xs font-medium text-muted-foreground">Month over month</span>
          </CardHeader>
          <CardContent className="px-4">
            {data.monthOverMonthChangePct === null ? (
              <div className="text-lg font-semibold text-muted-foreground">—</div>
            ) : (
              <div
                className={`flex items-center gap-1 text-lg font-semibold tabular-nums ${
                  data.monthOverMonthChangePct >= 0 ? "text-destructive" : "text-success"
                }`}
              >
                {data.monthOverMonthChangePct >= 0 ? (
                  <ArrowUpRight className="size-4" />
                ) : (
                  <ArrowDownRight className="size-4" />
                )}
                {Math.abs(data.monthOverMonthChangePct).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <span className="text-xs font-medium text-muted-foreground">Highest expense</span>
          </CardHeader>
          <CardContent className="px-4">
            {data.highestExpense ? (
              <>
                <div className="truncate text-sm font-semibold">{data.highestExpense.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatMoney(data.highestExpense.amount, currency)} · {formatDate(data.highestExpense.date)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No expenses yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="py-4 lg:col-span-3">
          <CardHeader className="flex-row items-center gap-2 px-4">
            <TrendingUp className="size-4 text-primary" />
            <p className="text-sm font-semibold">Monthly spending trend</p>
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), currency)}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 lg:col-span-2">
          <CardHeader className="px-4">
            <p className="text-sm font-semibold">Category distribution</p>
          </CardHeader>
          <CardContent className="px-4">
            {pieData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              {data.categoryDistribution.slice(0, 5).map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-medium tabular-nums">{formatMoney(c.total, currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="py-4">
        <CardHeader className="px-4">
          <p className="text-sm font-semibold">Spending by payer</p>
        </CardHeader>
        <CardContent className="px-4">
          {data.payerBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.payerBreakdown.map((p) => (
                <div key={p.userId} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-medium tabular-nums">{formatMoney(p.total, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
