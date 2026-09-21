"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { getDashboard, type DashboardData } from "@/lib/api/dashboard";
import { AdminDashboardView } from "@/components/room/admin-dashboard-view";
import { RoommateDashboardView } from "@/components/room/roommate-dashboard-view";
import { MonthPicker } from "@/components/room/month-picker";

export function RoomDashboard({ roomId }: { roomId: string }) {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await getDashboard(roomId, month, year);
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [roomId, month, year]);

  React.useEffect(() => {
    load();
  }, [load]);

  function handleMonthChange(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const picker = <MonthPicker month={month} year={year} onChange={handleMonthChange} />;

  if (!data && loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{picker}</div>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return data.viewerRole === "ADMIN" ? (
    <AdminDashboardView data={data} roomId={roomId} onRefresh={load} monthPicker={picker} loading={loading} />
  ) : (
    <RoommateDashboardView data={data} roomId={roomId} monthPicker={picker} loading={loading} />
  );
}
