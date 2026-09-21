import type { Metadata } from "next";
import { AppTopbar } from "@/components/app-topbar";
import { ProfilePage } from "@/components/profile/profile-page";

export const metadata: Metadata = {
  title: "Profile & settings",
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar />
      <main className="flex-1 bg-muted/30">
        <ProfilePage />
      </main>
    </div>
  );
}
