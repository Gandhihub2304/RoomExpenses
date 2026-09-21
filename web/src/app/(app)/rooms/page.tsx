import type { Metadata } from "next";
import { RoomsPicker } from "@/components/rooms/rooms-picker";
import { AppTopbar } from "@/components/app-topbar";

export const metadata: Metadata = {
  title: "Your rooms",
};

export default function RoomsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar />
      <main className="flex-1 bg-muted/30">
        <RoomsPicker />
      </main>
    </div>
  );
}
