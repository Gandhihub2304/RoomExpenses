"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "@/lib/room-context";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV_LINKS, ROOMMATE_NAV_LINKS } from "@/components/room/room-nav-links";

export function RoomMobileNav({ roomId }: { roomId: string }) {
  const { room } = useRoom();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const base = `/r/${roomId}`;
  const links = room?.myRole === "ADMIN" ? ADMIN_NAV_LINKS : ROOMMATE_NAV_LINKS;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
        }
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[80vw] flex-col bg-popover p-4 text-popover-foreground shadow-xl outline-none duration-150 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="font-heading text-base font-medium">
              {room?.name ?? "Menu"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-sm" aria-label="Close menu" />}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {links.map((link) => {
              const href = `${base}${link.href}`;
              const isActive = link.href === "" ? pathname === base : pathname.startsWith(href);
              return (
                <Link
                  key={link.href}
                  href={href}
                  onClick={() => setOpen(false)}
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
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
