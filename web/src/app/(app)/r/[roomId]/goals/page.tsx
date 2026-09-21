import { GoalsPage } from "@/components/goals/goals-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/goals">) {
  const { roomId } = await params;
  return <GoalsPage roomId={roomId} />;
}
