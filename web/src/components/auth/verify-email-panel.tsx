"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api/auth";

export function VerifyEmailPanel({ email }: { email: string }) {
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    await resendVerification(email);
    setResending(false);
    setCooldown(30);
    toast.success("Verification email sent");
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="size-6" />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        Verify your email
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        We&apos;ve sent a verification link to{" "}
        {email ? <strong>{email}</strong> : "your email address"}. Click it
        to activate your account.
      </p>

      <Button
        variant="outline"
        className="mt-6 w-full"
        disabled={!email || resending || cooldown > 0}
        onClick={handleResend}
      >
        {resending && <Loader2 className="size-4 animate-spin" />}
        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
      </Button>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to log in
        </Link>
      </p>
    </div>
  );
}
