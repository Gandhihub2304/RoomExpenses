import { BillsPage } from "@/components/bills/bills-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/bills">) {
  const { roomId } = await params;
  return <BillsPage roomId={roomId} />;
}
