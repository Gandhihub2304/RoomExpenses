import { ActivityPage } from "@/components/activity/activity-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/activity">) {
  const { roomId } = await params;
  return <ActivityPage roomId={roomId} />;
}
