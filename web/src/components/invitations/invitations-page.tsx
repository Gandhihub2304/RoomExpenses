"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/form-field";
import { useRoom } from "@/lib/room-context";
import { listInvitations, createInvitation, revokeInvitation, type Invitation } from "@/lib/api/invitations";
import { formatDate } from "@/lib/format";

export function InvitationsPage({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const [invitations, setInvitations] = React.useState<Invitation[] | null>(null);
  const [email, setEmail] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    const result = await listInvitations(roomId);
    if (result.ok) setInvitations(result.data);
  }, [roomId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const inviteLink =
    typeof window !== "undefined" && room ? `${window.location.origin}/invite/${room.inviteCode}` : "";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const result = await createInvitation(roomId, {
      email: email.trim() || undefined,
      role: "ROOMMATE",
      expiresInDays: 7,
    });
    setCreating(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Invitation created");
    setEmail("");
    load();
  }

  async function handleRevoke(invitation: Invitation) {
    const result = await revokeInvitation(roomId, invitation.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Invitation revoked");
    load();
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">
          Invite roommates to join {room?.name ?? "this room"}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="py-5">
          <CardHeader className="px-5">
            <p className="text-sm font-semibold">Room invite link</p>
            <p className="text-xs text-muted-foreground">
              Anyone with this link or QR code can join as a roommate.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 px-5">
            {inviteLink && (
              <div className="rounded-xl border border-border/60 bg-white p-4">
                <QRCodeSVG value={inviteLink} size={160} />
              </div>
            )}
            <div className="flex w-full gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copyLink(inviteLink)}>
                <Copy className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardHeader className="px-5">
            <p className="text-sm font-semibold">Send an email invitation</p>
            <p className="text-xs text-muted-foreground">
              Creates a single-use invite link tied to an email address.
            </p>
          </CardHeader>
          <CardContent className="px-5">
            <form onSubmit={handleCreate} className="space-y-3">
              <FormField id="invite-email" label="Email (optional)">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="roommate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="size-4 animate-spin" />}
                <Plus />
                Create invitation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Pending invitations</h2>
        {invitations === null ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
            <Mail className="size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No pending invitations.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <div className="divide-y divide-border/60">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.email ?? "Open invite link"}</p>
                    <p className="text-xs text-muted-foreground">Expires {formatDate(inv.expiresAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">{inv.role === "ADMIN" ? "Admin" : "Roommate"}</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        copyLink(`${window.location.origin}/invite/${inv.code}`)
                      }
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleRevoke(inv)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
