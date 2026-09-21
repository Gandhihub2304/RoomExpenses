import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verifyAccessToken } from "@/utils/tokens";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";

let io: SocketIOServer | undefined;

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;
}

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = parseCookie(socket.handshake.headers.cookie, "rm_access");
      if (!token) return next(new Error("Unauthorized"));
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    const memberships = await prisma.roomMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { roomId: true },
    });
    for (const m of memberships) {
      socket.join(`room:${m.roomId}`);
    }
  });

  return io;
}

export function getIO() {
  return io;
}
