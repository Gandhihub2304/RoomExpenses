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
  Target,
  type LucideIcon,
} from "lucide-react";

export interface RoomNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

// Each nav item gets its own accent color so the sidebar is easy to scan
// at a glance, not just a wall of same-colored icons.
export const ADMIN_NAV_LINKS: RoomNavLink[] = [
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

export const ROOMMATE_NAV_LINKS: RoomNavLink[] = [
  { href: "", label: "Dashboard", icon: LayoutDashboard, color: "text-indigo-500" },
  { href: "/expenses", label: "Expenses", icon: Receipt, color: "text-emerald-500" },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle, color: "text-teal-500" },
  { href: "/recurring", label: "Recurring Expenses", icon: Repeat, color: "text-violet-500" },
  { href: "/goals", label: "Goals", icon: Target, color: "text-pink-500" },
  { href: "/settlements", label: "Settlements", icon: HandCoins, color: "text-amber-500" },
  { href: "/bills", label: "Bills", icon: FileClock, color: "text-rose-500" },
  { href: "/notifications", label: "Notifications", icon: Bell, color: "text-yellow-500" },
];
