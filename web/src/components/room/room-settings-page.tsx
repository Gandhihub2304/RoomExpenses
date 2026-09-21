"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogOut, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/form-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRoom } from "@/lib/room-context";
import { updateRoom, leaveRoom } from "@/lib/api/rooms";

export function RoomSettingsPage({ roomId }: { roomId: string }) {
  const { room, refresh } = useRoom();
  const router = useRouter();
  const isAdmin = room?.myRole === "ADMIN";

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [monthlyBudget, setMonthlyBudget] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  React.useEffect(() => {
    if (!room) return;
    setName(room.name);
    setType(room.type);
    setAddress(room.address ?? "");
    setDescription(room.description ?? "");
    setMonthlyBudget(room.monthlyBudget ?? "");
    setRules(room.rules ?? "");
  }, [room]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateRoom(roomId, {
      name,
      type,
      address: address || undefined,
      description: description || undefined,
      monthlyBudget: monthlyBudget ? Number(monthlyBudget) : undefined,
      rules: rules || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Room settings saved");
    refresh();
  }

  async function handleLeave() {
    const result = await leaveRoom(roomId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("You've left the room");
    router.push("/rooms");
  }

  if (!room) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Only room admins can edit room settings.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLeaveOpen(true)}>
          <LogOut />
          Leave room
        </Button>
        <ConfirmDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title="Leave this room?"
          description="You'll lose access to this room's expenses and balances. You can rejoin later with an invite."
          confirmLabel="Leave room"
          onConfirm={handleLeave}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Room settings</h1>
        <p className="text-sm text-muted-foreground">Manage details for {room.name}.</p>
      </div>

      <Card className="py-5">
        <CardHeader className="px-5">
          <p className="text-sm font-semibold">Room details</p>
        </CardHeader>
        <CardContent className="px-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="room-name" label="Room name">
                <Input id="room-name" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField id="room-type" label="Room type">
                <Input id="room-type" value={type} onChange={(e) => setType(e.target.value)} />
              </FormField>
            </div>
            <FormField id="room-address" label="Address (optional)">
              <Input id="room-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
            <FormField id="room-budget" label={`Monthly budget (${room.currency})`}>
              <Input
                id="room-budget"
                type="number"
                min={0}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
              />
            </FormField>
            <FormField id="room-description" label="Description (optional)">
              <Textarea id="room-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormField>
            <FormField id="room-rules" label="Room rules (optional)">
              <Textarea id="room-rules" rows={3} value={rules} onChange={(e) => setRules(e.target.value)} />
            </FormField>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 py-5">
        <CardHeader className="px-5">
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
        </CardHeader>
        <CardContent className="px-5">
          <p className="text-sm text-muted-foreground">
            Leaving removes your access to this room. You can rejoin later with an invite.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => setLeaveOpen(true)}>
            <LogOut />
            Leave room
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this room?"
        description="You'll lose access to this room's expenses and balances. You can rejoin later with an invite."
        confirmLabel="Leave room"
        onConfirm={handleLeave}
      />
    </div>
  );
}
