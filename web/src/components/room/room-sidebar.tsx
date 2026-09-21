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
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "@/lib/room-context";

// Each nav item gets its own accent color so the sidebar is easy to scan
// at a glance, not just a wall of same-colored icons.
const ADMIN_LINKS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard, color: "text-indigo-500" },
  { href: "/expenses", label: "Expenses", icon: Receipt, color: "text-emerald-500" },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle, color: "text-teal-500" },
  { href: "/recurring", label: "Recurring Expenses", icon: Repeat, color: "text-violet-500" },
  { href: "/goals", label: "Goals", icon: Target, color: "text-pink-500" },
  { href: "/members", label: "Roommates", icon: Users, color: "text-blue-500" },
  { href: "/invitations", label: "Invitations", icon: Mail, color: "text-cyan-500" },
  { href: "/settlements", label: "Settlements", icon: HandCoins, color: "text-amber-500" },
  { href: "/bills", label: "Bills", icon: FileClock, color: "text-rose-500" },
  { href: "/budget", label: "Budget", icon: PiggyBank, color: "text-fuchsia-500" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, color: "text-orange-500" },
  { href: "/notifications", label: "Notifications", icon: Bell, color: "text-yellow-500" },
  { href: "/activity", label: "Activity Logs", icon: History, color: "text-slate-500" },
  { href: "/settings", label: "Room Settings", icon: Settings, color: "text-gray-500" },
];

const ROOMMATE_LINKS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard, color: "text-indigo-500" },
  { href: "/expenses", label: "Expenses", icon: Receipt, color: "text-emerald-500" },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle, color: "text-teal-500" },
  { href: "/goals", label: "Goals", icon: Target, color: "text-pink-500" },
  { href: "/settlements", label: "Settlements", icon: ArrowLeftRight, color: "text-amber-500" },
  { href: "/bills", label: "Bills", icon: FileClock, color: "text-rose-500" },
  { href: "/notifications", label: "Notifications", icon: Bell, color: "text-yellow-500" },
];

export function RoomSidebar({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const pathname = usePathname();
  const base = `/r/${roomId}`;
  const links = room?.myRole === "ADMIN" ? ADMIN_LINKS : ROOMMATE_LINKS;

  return (
    <nav className="hidden w-60 shrink-0 overflow-y-auto border-r border-border/60 py-6 pr-4 lg:block">
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
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <link.icon className={cn("size-4 shrink-0", link.color)} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
