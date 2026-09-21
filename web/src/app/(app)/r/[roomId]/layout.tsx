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
      <div className="flex min-h-screen flex-col">
        <RoomHeader roomId={roomId} />
        <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
          <RoomSidebar roomId={roomId} />
          <main className="min-w-0 flex-1 py-6 pb-24 lg:pl-8 lg:pb-6">{children}</main>
        </div>
        <RoomBottomNav roomId={roomId} />
      </div>
    </RoomProvider>
  );
}
