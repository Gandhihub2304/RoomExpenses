import {
  SplitSquareHorizontal,
  ShieldCheck,
  BellRing,
  BarChart3,
  Receipt,
  Repeat,
  Users2,
  Wallet2,
} from "lucide-react";

const FEATURES = [
  {
    icon: SplitSquareHorizontal,
    title: "Smart expense splitting",
    description:
      "Equal, percentage, exact-amount, or share-based splits. RoomMate calculates everyone's balance automatically.",
  },
  {
    icon: Wallet2,
    title: "One-tap settlements",
    description:
      "See exactly who owes whom, with the minimum number of transactions needed to settle up the whole room.",
  },
  {
    icon: Repeat,
    title: "Recurring bills",
    description:
      "Rent, electricity, Wi-Fi, and groceries — set it once and RoomMate creates and reminds automatically.",
  },
  {
    icon: BarChart3,
    title: "Budget & analytics",
    description:
      "Category budgets with 70/80/90/100% alerts, spending trends, and downloadable monthly reports.",
  },
  {
    icon: Users2,
    title: "Role-based access",
    description:
      "Admins manage the room; roommates get full transparency into shared expenses and their own balance — nothing more.",
  },
  {
    icon: Receipt,
    title: "Receipt scanning",
    description:
      "Snap a photo of a bill and let smart extraction pull the amount, date, and category for confirmation.",
  },
  {
    icon: BellRing,
    title: "Real-time notifications",
    description:
      "New expenses, settlement requests, and overdue bills show up instantly across every roommate's dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    description:
      "Encrypted sessions, audited access, and strict room-level permissions keep your household's finances private.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your room needs to stay in sync
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            From splitting a grocery run to settling the month's rent —
            RoomMate keeps every roommate on the same page.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
