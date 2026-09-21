import { RoomSettingsPage } from "@/components/room/room-settings-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/settings">) {
  const { roomId } = await params;
  return <RoomSettingsPage roomId={roomId} />;
}
