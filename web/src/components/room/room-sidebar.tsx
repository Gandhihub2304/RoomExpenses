"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRoom } from "@/lib/room-context";
import { ADMIN_NAV_LINKS, ROOMMATE_NAV_LINKS } from "@/components/room/room-nav-links";

export function RoomSidebar({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const pathname = usePathname();
  const base = `/r/${roomId}`;
  const links = room?.myRole === "ADMIN" ? ADMIN_NAV_LINKS : ROOMMATE_NAV_LINKS;

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
