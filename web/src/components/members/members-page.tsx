"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, MoreVertical, ShieldCheck, UserMinus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { listMembers, updateMember, removeMember, type RoomMemberDetail } from "@/lib/api/members";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function MembersPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const { user } = useAuth();
  const isAdmin = room?.myRole === "ADMIN";

  const [members, setMembers] = React.useState<RoomMemberDetail[] | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<RoomMemberDetail | null>(null);

  const load = React.useCallback(async () => {
    const result = await listMembers(roomId);
    if (result.ok) setMembers(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleToggleRole(member: RoomMemberDetail) {
    const newRole = member.role === "ADMIN" ? "ROOMMATE" : "ADMIN";
    const result = await updateMember(roomId, member.id, { role: newRole });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`${member.user.name} is now ${newRole === "ADMIN" ? "an admin" : "a roommate"}`);
    load();
  }

  async function handleToggleSuspend(member: RoomMemberDetail) {
    const newStatus = member.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const result = await updateMember(roomId, member.id, { status: newStatus });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(newStatus === "SUSPENDED" ? "Member suspended" : "Member reactivated");
    load();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const result = await removeMember(roomId, removeTarget.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Member removed");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roommates</h1>
          <p className="text-sm text-muted-foreground">
            Everyone with access to {room?.name ?? "this room"}.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href={`/r/${roomId}/invitations`}>
              <Mail />
              Invite roommate
            </Link>
          </Button>
        )}
      </div>

      {members === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/60">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{initials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {member.user.name}
                        {member.userId === user?.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                    {member.role === "ADMIN" ? "Admin" : "Roommate"}
                  </Badge>
                  {member.status === "SUSPENDED" && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}

                  {isAdmin && member.userId !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleRole(member)}>
                          <ShieldCheck />
                          Make {member.role === "ADMIN" ? "roommate" : "admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSuspend(member)}>
                          <UserCog />
                          {member.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setRemoveTarget(member)}>
                          <UserMinus />
                          Remove from room
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this roommate?"
        description={`${removeTarget?.user.name} will lose access to this room. Their expense history will be kept for accurate records.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
      />
    </div>
  );
}
