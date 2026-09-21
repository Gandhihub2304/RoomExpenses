import { InvitationsPage } from "@/components/invitations/invitations-page";

export default async function Page({ params }: PageProps<"/r/[roomId]/invitations">) {
  const { roomId } = await params;
  return <InvitationsPage roomId={roomId} />;
}
