"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Monitor, Save, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, changePassword, listSessions, revokeSession, logoutAll, type SessionInfo } from "@/lib/api/auth";
import { relativeTime } from "@/lib/format";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ProfilePage() {
  const { user, refresh, logout } = useAuth();

  const [name, setName] = React.useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);

  const [sessions, setSessions] = React.useState<SessionInfo[] | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = React.useState(false);

  React.useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const loadSessions = React.useCallback(async () => {
    const result = await listSessions();
    if (result.ok) setSessions(result.data);
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({ name: name.trim() });
    setSavingProfile(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Profile updated");
    refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Fill in both password fields");
      return;
    }
    setChangingPassword(true);
    const result = await changePassword({ currentPassword, newPassword });
    setChangingPassword(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Password changed. Please log in again.");
    setCurrentPassword("");
    setNewPassword("");
    logout();
  }

  async function handleRevokeSession(sessionId: string) {
    const result = await revokeSession(sessionId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Session signed out");
    loadSessions();
  }

  async function handleLogoutAll() {
    await logoutAll();
    logout();
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile & settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and security.</p>
      </div>

      <Card className="py-5">
        <CardHeader className="px-5">
          <p className="text-sm font-semibold">Profile</p>
        </CardHeader>
        <CardContent className="px-5">
          <div className="mb-5 flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <FormField id="profile-name" label="Full name">
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField id="profile-email" label="Email">
              <Input id="profile-email" value={user.email} disabled />
            </FormField>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="py-5">
        <CardHeader className="px-5">
          <p className="text-sm font-semibold">Change password</p>
        </CardHeader>
        <CardContent className="px-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormField id="current-password" label="Current password">
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>
            <FormField id="new-password" label="New password">
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="size-4 animate-spin" /> : <Shield />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="py-5">
        <CardHeader className="flex-row items-center justify-between px-5">
          <p className="text-sm font-semibold">Active sessions</p>
          {sessions && sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setLogoutAllOpen(true)}>
              <LogOut />
              Log out everywhere
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-5">
          {sessions === null ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    {s.userAgent?.toLowerCase().includes("mobile") ? (
                      <Smartphone className="size-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="size-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{s.userAgent ? s.userAgent.slice(0, 50) : "Unknown device"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.ipAddress ?? "Unknown IP"} · Active {relativeTime(s.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(s.id)}>
                    Sign out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Log out everywhere?"
        description="This will sign you out on all devices, including this one."
        confirmLabel="Log out everywhere"
        onConfirm={handleLogoutAll}
      />
    </div>
  );
}
