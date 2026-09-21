import { AcceptInvite } from "@/components/invitations/accept-invite";

export default async function InvitePage({ params }: PageProps<"/invite/[code]">) {
  const { code } = await params;
  return <AcceptInvite code={code} />;
}
