import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="aspect-1155/678 w-[72rem] bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent opacity-40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Built for shared rooms, flats, PGs & hostels
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Shared expenses,{" "}
            <span className="bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
              finally transparent.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            RoomMate helps roommates split rent and bills, track budgets, and
            settle up — with a real-time dashboard everyone can trust. No
            spreadsheets, no awkward money conversations.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">
                Create your room
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">I have an invite</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Free to use for your household · No credit card required
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
