"use client";

import * as React from "react";
import { History, Loader2, ShieldAlert } from "lucide-react";
import { useRoom } from "@/lib/room-context";
import { listActivity, type ActivityLogEntry } from "@/lib/api/activity";
import { formatDateTime } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  ARCHIVE: "archived",
  APPROVE: "approved",
  SETTLE: "settled",
  JOIN: "joined the room via",
  LEAVE: "left the room",
  REMOVE: "removed",
  SUSPEND: "suspended",
  INVITE: "invited someone to",
  ROLE_CHANGE: "changed the role of",
  LOGIN: "logged in",
  LOGOUT: "logged out",
};

export function ActivityPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const [items, setItems] = React.useState<ActivityLogEntry[] | null | "forbidden">(null);

  React.useEffect(() => {
    listActivity(roomId).then((result) => {
      if (result.ok) setItems(result.data);
      else if (result.code === "FORBIDDEN") setItems("forbidden");
    });
  }, [roomId]);

  if (room && room.myRole !== "ADMIN") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Only room admins can view the activity log.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          A complete audit trail of changes in {room?.name ?? "this room"}.
        </p>
      </div>

      {items === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items === "forbidden" || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <History className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {items.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 p-4">
                <p className="text-sm">
                  <span className="font-medium">{log.actor.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {ACTION_LABEL[log.action] ?? log.action.toLowerCase()}
                  </span>{" "}
                  {(() => {
                    const entity = log.entityType.replace(/([A-Z])/g, " $1").trim().toLowerCase();
                    return /^[aeiou]/.test(entity) ? `an ${entity}` : `a ${entity}`;
                  })()}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
