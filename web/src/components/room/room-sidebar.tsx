"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Repeat,
  Users,
  Mail,
  HandCoins,
  FileClock,
  PiggyBank,
  BarChart3,
  Bell,
  History,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "@/lib/room-context";

const ADMIN_LINKS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle },
  { href: "/recurring", label: "Recurring Expenses", icon: Repeat },
  { href: "/members", label: "Roommates", icon: Users },
  { href: "/invitations", label: "Invitations", icon: Mail },
  { href: "/settlements", label: "Settlements", icon: HandCoins },
  { href: "/bills", label: "Bills", icon: FileClock },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/activity", label: "Activity Logs", icon: History },
  { href: "/settings", label: "Room Settings", icon: Settings },
];

const ROOMMATE_LINKS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle },
  { href: "/settlements", label: "Settlements", icon: ArrowLeftRight },
  { href: "/bills", label: "Bills", icon: FileClock },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function RoomSidebar({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const pathname = usePathname();
  const base = `/r/${roomId}`;
  const links = room?.myRole === "ADMIN" ? ADMIN_LINKS : ROOMMATE_LINKS;

  return (
    <nav className="hidden w-60 shrink-0 border-r border-border/60 py-6 pr-4 lg:block">
      <div className="flex flex-col gap-0.5">
        {links.map((link) => {
          const href = `${base}${link.href}`;
          const isActive = link.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
