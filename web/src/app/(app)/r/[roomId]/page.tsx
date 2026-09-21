import { RoomDashboard } from "@/components/room/room-dashboard";

export default async function RoomDashboardPage({ params }: PageProps<"/r/[roomId]">) {
  const { roomId } = await params;
  return <RoomDashboard roomId={roomId} />;
}
