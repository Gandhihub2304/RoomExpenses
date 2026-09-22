import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const invite = typeof params.invite === "string" ? params.invite : undefined;
  return <LoginForm inviteCode={invite} />;
}
