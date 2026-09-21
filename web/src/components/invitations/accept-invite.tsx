"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinRoom } from "@/lib/api/rooms";

export function AcceptInvite({ code }: { code: string }) {
  const router = useRouter();
  const [joining, setJoining] = React.useState(false);

  async function handleJoin() {
    setJoining(true);
    const result = await joinRoom(code);
    setJoining(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("You've joined the room");
    router.push(`/r/${result.data.roomId}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Home className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">You've been invited</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join this room to start tracking shared expenses with your roommates.
        </p>
        <Button className="mt-6 w-full" onClick={handleJoin} disabled={joining}>
          {joining && <Loader2 className="size-4 animate-spin" />}
          Accept & join room
        </Button>
      </div>
    </div>
  );
}
