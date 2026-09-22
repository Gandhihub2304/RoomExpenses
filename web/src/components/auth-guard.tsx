"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// The invite page must stay reachable while logged out — it handles its own
// login/register prompt so a scanned QR code doesn't just bounce to /login.
const PUBLIC_PATH_PREFIXES = ["/invite/"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  React.useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublicPath, router]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
