import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Stop chasing roommates for money
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-pretty">
            Create your room in under a minute and invite everyone you live
            with. It's free, transparent, and built for real households.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/register">
                Create your room
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground sm:w-auto"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
