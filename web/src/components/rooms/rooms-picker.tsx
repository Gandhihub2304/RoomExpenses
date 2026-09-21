"use client";

import * as React from "react";
import Link from "next/link";
import { Home, Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyRooms } from "@/lib/api/rooms";
import type { RoomSummary } from "@/lib/types";
import { CreateRoomDialog } from "@/components/rooms/create-room-dialog";
import { JoinRoomDialog } from "@/components/rooms/join-room-dialog";

export function RoomsPicker() {
  const [rooms, setRooms] = React.useState<RoomSummary[] | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);

  const loadRooms = React.useCallback(async () => {
    const result = await listMyRooms();
    setRooms(result.ok ? result.data : []);
  }, []);

  React.useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  if (rooms === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between rooms you belong to, or set up a new one.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            I have an invite
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Create room
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Home className="size-7" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">No rooms yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">
            Create your first room to start tracking shared expenses, or join
            one using an invite link from a roommate.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              I have an invite
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Create your room
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/r/${room.id}`}
              className="group rounded-2xl border border-border/60 bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Home className="size-5" />
                </div>
                <Badge variant={room.role === "ADMIN" ? "default" : "secondary"}>
                  {room.role === "ADMIN" ? "Admin" : "Roommate"}
                </Badge>
              </div>
              <h3 className="mt-4 font-semibold group-hover:text-primary">{room.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{room.type}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {room.memberCount} {room.memberCount === 1 ? "member" : "members"}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadRooms} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} onJoined={loadRooms} />
    </div>
  );
}
