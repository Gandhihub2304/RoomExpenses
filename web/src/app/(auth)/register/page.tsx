import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const invite = typeof params.invite === "string" ? params.invite : undefined;
  return <RegisterForm inviteCode={invite} />;
}
