import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 11L12 4L21 11"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 10V19.4C5 19.7314 5.26863 20 5.6 20H9.4C9.73137 20 10 19.7314 10 19.4V15.6C10 15.2686 10.2686 15 10.6 15H13.4C13.7314 15 14 15.2686 14 15.6V19.4C14 19.7314 14.2686 20 14.6 20H18.4C18.7314 20 19 19.7314 19 19.4V10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg">RoomMate</span>
    </Link>
  );
}
