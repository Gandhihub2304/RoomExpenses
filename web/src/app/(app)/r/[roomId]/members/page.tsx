import { MembersPage } from "@/components/members/members-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/members">) {
  const { roomId } = await params;
  return <MembersPage roomId={roomId} />;
}
