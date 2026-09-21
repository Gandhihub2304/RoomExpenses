const STEPS = [
  {
    step: "01",
    title: "Create your room",
    description:
      "Set up your room with a name, monthly budget, and currency. Takes less than a minute.",
  },
  {
    step: "02",
    title: "Invite your roommates",
    description:
      "Share an invite link or QR code. Roommates join instantly and see the room's full expense history.",
  },
  {
    step: "03",
    title: "Log expenses as you go",
    description:
      "Add an expense, choose how to split it, and RoomMate updates everyone's balance in real time.",
  },
  {
    step: "04",
    title: "Settle up with confidence",
    description:
      "RoomMate tells you exactly who to pay and how much — with the fewest transactions possible.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Up and running in four steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            No onboarding calls, no setup fees — just a room that works the
            way your household actually lives.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, i) => (
            <div key={item.step} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="hidden h-px flex-1 bg-border sm:block lg:hidden" />
                )}
              </div>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
