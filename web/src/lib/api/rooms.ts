import { api } from "@/lib/api/client";
import type { RoomSummary } from "@/lib/types";

export interface CreateRoomInput {
  name: string;
  type: string;
  address?: string;
  description?: string;
  currency: string;
  timezone: string;
  monthlyBudget?: number;
  memberLimit: number;
  rules?: string;
}

export function listMyRooms() {
  return api.get<RoomSummary[]>("/rooms");
}

export function createRoom(input: CreateRoomInput) {
  return api.post<{ id: string }>("/rooms", input);
}

export function joinRoom(code: string) {
  return api.post<{ roomId: string }>("/rooms/join", { code });
}

export function getRoomDetail(roomId: string) {
  return api.get(`/rooms/${roomId}`);
}

export function updateRoom(roomId: string, input: Partial<CreateRoomInput>) {
  return api.patch(`/rooms/${roomId}`, input);
}

export function leaveRoom(roomId: string) {
  return api.post<{ success: boolean }>(`/rooms/${roomId}/leave`);
}
