"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { getDashboard, type DashboardData } from "@/lib/api/dashboard";
import { AdminDashboardView } from "@/components/room/admin-dashboard-view";
import { RoommateDashboardView } from "@/components/room/roommate-dashboard-view";

export function RoomDashboard({ roomId }: { roomId: string }) {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const result = await getDashboard(roomId);
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.message);
    }
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return data.viewerRole === "ADMIN" ? (
    <AdminDashboardView data={data} roomId={roomId} onRefresh={load} />
  ) : (
    <RoommateDashboardView data={data} roomId={roomId} />
  );
}
