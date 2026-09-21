import { RecurringPage } from "@/components/recurring/recurring-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/recurring">) {
  const { roomId } = await params;
  return <RecurringPage roomId={roomId} />;
}
