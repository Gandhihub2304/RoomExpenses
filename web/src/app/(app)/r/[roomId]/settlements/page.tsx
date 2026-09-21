import { SettlementsPage } from "@/components/settlements/settlements-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/settlements">) {
  const { roomId } = await params;
  return <SettlementsPage roomId={roomId} />;
}
