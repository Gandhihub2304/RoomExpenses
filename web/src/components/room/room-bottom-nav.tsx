"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PlusCircle, Users, HandCoins, MoreHorizontal, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "@/lib/room-context";

const ADMIN_LINKS = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/members", label: "Members", icon: Users },
  { href: "/settlements", label: "Settle", icon: HandCoins },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

const ROOMMATE_LINKS = [
  { href: "", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/expenses/new", label: "Add", icon: PlusCircle },
  { href: "/settlements", label: "Settle", icon: HandCoins },
  { href: "/profile", label: "Profile", icon: User },
];

export function RoomBottomNav({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const pathname = usePathname();
  const base = `/r/${roomId}`;
  const links = room?.myRole === "ADMIN" ? ADMIN_LINKS : ROOMMATE_LINKS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5">
        {links.map((link) => {
          const href = `${base}${link.href}`;
          const isActive = link.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <link.icon className="size-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
