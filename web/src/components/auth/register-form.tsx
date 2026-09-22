"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { register as registerUser } from "@/lib/api/auth";
import { savePendingInvite } from "@/lib/pending-invite";

export function RegisterForm({ inviteCode }: { inviteCode?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (inviteCode) savePendingInvite(inviteCode);
  }, [inviteCode]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: undefined,
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const result = await registerUser(values);
    if (!result.ok) {
      setServerError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success("Account created! Check your email to verify.");
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start managing your room&apos;s expenses in minutes.
        </p>
      </div>

      <GoogleButton label="Sign up with Google" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        aria-describedby={serverError ? "register-error" : undefined}
      >
        {serverError && (
          <div
            id="register-error"
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <FormField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Aakash Sharma"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <PasswordStrength password={watch("password") ?? ""} />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </FormField>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="acceptTerms"
              className="mt-0.5"
              checked={watch("acceptTerms") === true}
              onCheckedChange={(checked) =>
                setValue(
                  "acceptTerms",
                  (checked === true ? true : undefined) as true,
                  { shouldValidate: true },
                )
              }
            />
            <label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
              I agree to the{" "}
              <Link href="#" className="font-medium text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={inviteCode ? `/login?invite=${encodeURIComponent(inviteCode)}` : "/login"}
          className="font-medium text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
