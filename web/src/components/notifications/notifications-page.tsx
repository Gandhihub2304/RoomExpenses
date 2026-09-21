"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/api/notifications";
import { relativeTime } from "@/lib/format";

export function NotificationsPage() {
  const [items, setItems] = React.useState<NotificationItem[] | null>(null);

  const load = React.useCallback(async () => {
    const result = await listNotifications();
    if (result.ok) setItems(result.data);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleRead(item: NotificationItem) {
    if (item.readAt) return;
    await markNotificationRead(item.id);
    load();
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    load();
  }

  const unreadCount = items?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleReadAll}>
            Mark all as read
          </Button>
        )}
      </div>

      {items === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <BellOff className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-base font-semibold">No notifications yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Activity in your rooms will show up here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRead(item)}
                className={cn(
                  "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                  !item.readAt && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full",
                    item.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{relativeTime(item.createdAt)}</p>
                </div>
                {!item.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
