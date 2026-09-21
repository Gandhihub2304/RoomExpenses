import { Lock, KeyRound, Eye, ServerCog } from "lucide-react";

const POINTS = [
  {
    icon: Lock,
    title: "Encrypted by default",
    description:
      "Passwords are hashed, sessions are stored in secure HttpOnly cookies, and all traffic is encrypted in transit.",
  },
  {
    icon: KeyRound,
    title: "Strict room-level access",
    description:
      "Every request is authorized against your actual room membership and role — never just a hidden button.",
  },
  {
    icon: Eye,
    title: "Full audit trail",
    description:
      "Every expense edit, settlement, and member change is logged so admins always know who did what, and when.",
  },
  {
    icon: ServerCog,
    title: "No banking data stored",
    description:
      "RoomMate never stores banking credentials — only optional UPI IDs and payment references you choose to add.",
  },
];

export function Security() {
  return (
    <section id="security" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your room&apos;s finances, kept private and precise
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Money between roommates is personal. RoomMate is built with
              security as a first-class requirement, not an afterthought —
              every permission is enforced on the backend, not just hidden in
              the UI.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-border/60 bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <point.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
