import { api } from "@/lib/api/client";
import type { RoomRole } from "@/lib/types";

export interface Invitation {
  id: string;
  email: string | null;
  code: string;
  role: RoomRole;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export function listInvitations(roomId: string) {
  return api.get<Invitation[]>(`/rooms/${roomId}/invitations`);
}

export function createInvitation(
  roomId: string,
  input: { email?: string; role: RoomRole; expiresInDays: number },
) {
  return api.post<Invitation>(`/rooms/${roomId}/invitations`, input);
}

export function revokeInvitation(roomId: string, invitationId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/invitations/${invitationId}`);
}
