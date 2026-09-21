import { ArrowDownRight, ArrowUpRight, Wallet, Receipt, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATS = [
  {
    label: "Room spending (Sep)",
    value: "₹48,320",
    delta: "+12.4%",
    trend: "up" as const,
    icon: Wallet,
  },
  {
    label: "Your balance",
    value: "₹1,240",
    caption: "owed to you",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "Pending settlements",
    value: "3",
    caption: "across 4 roommates",
    trend: "down" as const,
    icon: Users,
  },
  {
    label: "Upcoming bills",
    value: "2",
    caption: "due in 5 days",
    trend: "down" as const,
    icon: Receipt,
  },
];

const RECENT = [
  { title: "Electricity bill", by: "Aakash", amount: "₹2,150", category: "Utilities" },
  { title: "Groceries – BigBasket", by: "You", amount: "₹1,860", category: "Groceries" },
  { title: "Wi-Fi – Monthly", by: "Priya", amount: "₹999", category: "Internet" },
];

const BARS = [40, 65, 50, 80, 55, 70, 90];

export function DashboardPreview() {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-card/60 p-2 shadow-2xl shadow-primary/5 backdrop-blur-sm sm:p-3">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">
          Green Valley PG · Admin Dashboard
        </span>
      </div>

      <div className="rounded-xl border border-border/60 bg-background p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="gap-2 py-4 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4">
                <div className="text-xl font-semibold tabular-nums">
                  {stat.value}
                </div>
                {stat.delta ? (
                  <div
                    className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${
                      stat.trend === "up" ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {stat.delta}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.caption}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          <Card className="gap-3 py-4 shadow-none lg:col-span-3">
            <CardHeader className="flex-row items-center justify-between px-4">
              <div>
                <p className="text-sm font-semibold">Spending trend</p>
                <p className="text-xs text-muted-foreground">Last 7 weeks</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                This month
              </Badge>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex h-28 items-end gap-2">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-md bg-gradient-to-t from-primary/70 to-primary/30"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 py-4 shadow-none lg:col-span-2">
            <CardHeader className="px-4">
              <p className="text-sm font-semibold">Recent expenses</p>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              {RECENT.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.by} · {item.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {item.amount}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
