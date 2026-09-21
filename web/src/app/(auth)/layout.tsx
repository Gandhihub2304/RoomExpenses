import { ShieldCheck, SplitSquareHorizontal, Users2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const HIGHLIGHTS = [
  {
    icon: SplitSquareHorizontal,
    title: "Split any expense in seconds",
    description: "Equal, percentage, exact, or share-based — you choose.",
  },
  {
    icon: Users2,
    title: "Built for real households",
    description: "Multiple rooms, multiple roles, always in sync.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Every permission enforced server-side, not just in the UI.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          &copy; {new Date().getFullYear()} RoomMate. All rights reserved.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]"
        />
        <div className="relative">
          <p className="text-sm font-medium text-primary-foreground/70">
            RoomMate for households
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-semibold text-balance text-primary-foreground">
            Shared living, without the awkward money talk.
          </h2>
        </div>

        <div className="relative space-y-6">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-foreground">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="font-medium text-primary-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/70">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Trusted by roommates in shared flats, PGs, hostels, and apartments.
        </p>
      </div>
    </div>
  );
}
