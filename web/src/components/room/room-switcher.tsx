"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Home, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { listMyRooms } from "@/lib/api/rooms";
import type { RoomSummary } from "@/lib/types";

export function RoomSwitcher({ roomId, roomName }: { roomId: string; roomName: string }) {
  const [rooms, setRooms] = React.useState<RoomSummary[]>([]);

  React.useEffect(() => {
    listMyRooms().then((result) => {
      if (result.ok) setRooms(result.data);
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="max-w-52 justify-between gap-2 px-2">
            <span className="flex min-w-0 items-center gap-2">
              <Home className="size-4 shrink-0 text-primary" />
              <span className="truncate font-semibold">{roomName}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {rooms.map((room) => (
          <DropdownMenuItem
            key={room.id}
            render={<Link href={`/r/${room.id}`} />}
          >
            <Home className="size-4" />
            <span className="flex-1 truncate">{room.name}</span>
            {room.id === roomId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/rooms" />}>
          <Plus className="size-4" />
          Manage rooms
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
