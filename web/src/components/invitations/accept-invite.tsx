"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinRoom } from "@/lib/api/rooms";
import { useAuth } from "@/lib/auth-context";
import { savePendingInvite } from "@/lib/pending-invite";

export function AcceptInvite({ code }: { code: string }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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

  function handleCreateAccount() {
    savePendingInvite(code);
    router.push(`/register?invite=${encodeURIComponent(code)}`);
  }

  function handleLogin() {
    savePendingInvite(code);
    router.push(`/login?invite=${encodeURIComponent(code)}`);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Home className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">You&apos;ve been invited</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join this room to start tracking shared expenses with your roommates.
        </p>

        {user ? (
          <Button className="mt-6 w-full" onClick={handleJoin} disabled={joining}>
            {joining && <Loader2 className="size-4 animate-spin" />}
            Accept & join room
          </Button>
        ) : (
          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={handleCreateAccount}>
              Create account & join
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="font-medium text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
