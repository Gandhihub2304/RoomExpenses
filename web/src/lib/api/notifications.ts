import { api } from "@/lib/api/client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  roomId: string | null;
}

export function listNotifications(page = 1) {
  return api.get<NotificationItem[]>(`/notifications?page=${page}`);
}

export function markNotificationRead(id: string) {
  return api.post(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.post(`/notifications/read-all`);
}
