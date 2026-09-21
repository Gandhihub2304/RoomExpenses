"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import type { RoomRole } from "@/lib/types";

export interface RoomMember {
  id: string;
  role: RoomRole;
  status: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export interface RoomDetail {
  id: string;
  name: string;
  type: string;
  address: string | null;
  description: string | null;
  currency: string;
  timezone: string;
  monthlyBudget: string | null;
  memberLimit: number;
  rules: string | null;
  inviteCode: string;
  myRole: RoomRole;
  memberships: RoomMember[];
}

interface RoomContextValue {
  room: RoomDetail | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const RoomContext = React.createContext<RoomContextValue | null>(null);

export function RoomProvider({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const [room, setRoom] = React.useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    const result = await api.get<RoomDetail>(`/rooms/${roomId}`);
    if (result.ok) {
      setRoom(result.data);
      setError(null);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  }, [roomId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <RoomContext.Provider value={{ room, isLoading, error, refresh }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = React.useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
