import { AnalyticsPage } from "@/components/analytics/analytics-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/analytics">) {
  const { roomId } = await params;
  return <AnalyticsPage roomId={roomId} />;
}
