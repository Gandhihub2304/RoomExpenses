import { RoomProvider } from "@/lib/room-context";
import { RoomHeader } from "@/components/room/room-header";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { RoomBottomNav } from "@/components/room/room-bottom-nav";

export default async function RoomLayout({
  children,
  params,
}: LayoutProps<"/r/[roomId]">) {
  const { roomId } = await params;

  return (
    <RoomProvider roomId={roomId}>
      <div className="h-screen overflow-hidden">
        <RoomHeader roomId={roomId} />
        <div className="flex h-[calc(100vh-4rem)]">
          <RoomSidebar roomId={roomId} />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
              {children}
            </div>
          </main>
        </div>
        <RoomBottomNav roomId={roomId} />
      </div>
    </RoomProvider>
  );
}
