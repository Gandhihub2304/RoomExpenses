import { RoomRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyUser, broadcastRoomActivity } from "@/services/notification.service";
import { getRoomBalanceSummary } from "@/services/balance.service";
import type { CreateSettlementInput, UpdateSettlementStatusInput } from "@/validators/settlement";

export async function getRoomSettlementOverview(roomId: string) {
  const [summary, pending] = await Promise.all([
    getRoomBalanceSummary(roomId),
    prisma.settlement.findMany({
      where: { roomId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { ...summary, pendingSettlements: pending };
}

export async function listSettlementHistory(roomId: string, page: number, pageSize: number) {
  const [items, total] = await Promise.all([
    prisma.settlement.findMany({
      where: { roomId },
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.settlement.count({ where: { roomId } }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function createSettlement(roomId: string, actorId: string, input: CreateSettlementInput) {
  if (input.fromUserId === input.toUserId) {
    throw ApiError.badRequest("A settlement must be between two different people");
  }

  const members = await prisma.roomMembership.findMany({
    where: { roomId, userId: { in: [input.fromUserId, input.toUserId] }, status: "ACTIVE" },
  });
  if (members.length !== 2) {
    throw ApiError.badRequest("Both people must be active members of this room");
  }

  // Only the payer (fromUser) or a room admin can record that a payment was made.
  const actorMembership = members.find((m) => m.userId === actorId);
  const isAdmin = actorMembership?.role === RoomRole.ADMIN;
  const isPayer = actorId === input.fromUserId;
  if (!isAdmin && !isPayer) {
    throw ApiError.forbidden("Only the person paying or a room admin can record this settlement");
  }

  const settlement = await prisma.settlement.create({
    data: {
      roomId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amount: input.amount,
      upiRef: input.upiRef,
      paymentNote: input.paymentNote,
      screenshotUrl: input.screenshotUrl,
      status: "PENDING",
    },
  });

  await logActivity({
    roomId,
    actorId,
    action: "CREATE",
    entityType: "Settlement",
    entityId: settlement.id,
    newValue: { amount: settlement.amount.toString(), from: input.fromUserId, to: input.toUserId },
  });

  await notifyUser({
    userId: input.toUserId,
    roomId,
    type: "SETTLEMENT_REQUESTED",
    title: "Payment recorded",
    body: `A payment of ${settlement.amount.toString()} was recorded. Confirm to complete the settlement.`,
    metadata: { settlementId: settlement.id },
  });
  broadcastRoomActivity(roomId, "SETTLEMENT_REQUESTED");

  return settlement;
}

export async function updateSettlementStatus(
  roomId: string,
  settlementId: string,
  actorId: string,
  actorRole: RoomRole,
  input: UpdateSettlementStatusInput,
) {
  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement || settlement.roomId !== roomId) {
    throw ApiError.notFound("Settlement not found");
  }

  // Only the recipient (toUser) confirming payment, or a room admin, may mark it settled.
  const isRecipient = actorId === settlement.toUserId;
  const isAdmin = actorRole === RoomRole.ADMIN;
  if (!isRecipient && !isAdmin) {
    throw ApiError.forbidden("Only the recipient or a room admin can confirm this settlement");
  }

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: input.status,
      upiRef: input.upiRef ?? settlement.upiRef,
      paymentNote: input.paymentNote ?? settlement.paymentNote,
      settledAt: input.status === "SETTLED" ? new Date() : settlement.settledAt,
    },
  });

  await logActivity({
    roomId,
    actorId,
    action: "SETTLE",
    entityType: "Settlement",
    entityId: settlementId,
    previousValue: { status: settlement.status },
    newValue: { status: updated.status },
  });

  if (input.status === "SETTLED") {
    await notifyUser({
      userId: settlement.fromUserId,
      roomId,
      type: "SETTLEMENT_COMPLETED",
      title: "Settlement confirmed",
      body: `Your payment of ${settlement.amount.toString()} has been confirmed`,
      metadata: { settlementId },
    });
  }
  broadcastRoomActivity(roomId, "SETTLEMENT_COMPLETED");

  return updated;
}
