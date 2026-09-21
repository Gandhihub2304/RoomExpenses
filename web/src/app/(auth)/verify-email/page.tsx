import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return <VerifyEmailPanel email={email} />;
}
