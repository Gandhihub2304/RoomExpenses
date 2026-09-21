import { api } from "@/lib/api/client";
import type { RoomRole } from "@/lib/types";

export interface RoomMemberDetail {
  id: string;
  userId: string;
  role: RoomRole;
  status: "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export function listMembers(roomId: string) {
  return api.get<RoomMemberDetail[]>(`/rooms/${roomId}/members`);
}

export function updateMember(roomId: string, membershipId: string, input: { role?: RoomRole; status?: "ACTIVE" | "SUSPENDED" }) {
  return api.patch(`/rooms/${roomId}/members/${membershipId}`, input);
}

export function removeMember(roomId: string, membershipId: string) {
  return api.delete<{ success: boolean }>(`/rooms/${roomId}/members/${membershipId}`);
}
