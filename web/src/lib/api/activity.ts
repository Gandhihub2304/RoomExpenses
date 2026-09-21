import { api } from "@/lib/api/client";

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
  actor: { id: string; name: string; avatarUrl: string | null };
}

export function listActivity(roomId: string, page = 1) {
  return api.get<ActivityLogEntry[]>(`/rooms/${roomId}/activity-log?page=${page}`);
}
