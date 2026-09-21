import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function notifyUser(params: {
  userId: string;
  roomId?: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      roomId: params.roomId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata,
    },
  });

  getIO()?.to(`user:${params.userId}`).emit("notification:new", notification);
  return notification;
}

export async function notifyRoomMembers(params: {
  roomId: string;
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const memberships = await prisma.roomMembership.findMany({
    where: { roomId: params.roomId, status: "ACTIVE" },
    select: { userId: true },
  });

  const recipients = memberships
    .map((m) => m.userId)
    .filter((id) => id !== params.excludeUserId);

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      roomId: params.roomId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata,
    })),
  });

  const io = getIO();
  if (io) {
    for (const userId of recipients) {
      io.to(`user:${userId}`).emit("notification:new", {
        roomId: params.roomId,
        type: params.type,
        title: params.title,
        body: params.body,
      });
    }
    io.to(`room:${params.roomId}`).emit("room:activity", {
      type: params.type,
      title: params.title,
      body: params.body,
    });
  }
}
