import { RoomRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import { sendInvitationEmail } from "@/services/email.service";
import { generateSecureToken } from "@/utils/tokens";
import type { CreateRoomInput, UpdateRoomInput, CreateInvitationInput } from "@/validators/room";

const DEFAULT_CATEGORIES = [
  { name: "Rent", icon: "home", color: "#6366f1" },
  { name: "Electricity", icon: "zap", color: "#f59e0b" },
  { name: "Water", icon: "droplet", color: "#0ea5e9" },
  { name: "Internet", icon: "wifi", color: "#8b5cf6" },
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
  { name: "Cleaning", icon: "sparkles", color: "#14b8a6" },
  { name: "Maintenance", icon: "wrench", color: "#ef4444" },
  { name: "Other", icon: "tag", color: "#64748b" },
];

export async function createRoom(userId: string, input: CreateRoomInput) {
  const room = await prisma.$transaction(async (tx) => {
    const created = await tx.room.create({
      data: {
        name: input.name,
        type: input.type,
        address: input.address,
        description: input.description,
        currency: input.currency,
        timezone: input.timezone,
        monthlyBudget: input.monthlyBudget,
        memberLimit: input.memberLimit,
        rules: input.rules,
        createdById: userId,
      },
    });

    await tx.roomMembership.create({
      data: { roomId: created.id, userId, role: RoomRole.ADMIN },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, roomId: created.id, isDefault: true })),
    });

    await logActivity({
      roomId: created.id,
      actorId: userId,
      action: "CREATE",
      entityType: "Room",
      entityId: created.id,
      newValue: { name: created.name },
      tx,
    });

    return created;
  });

  return room;
}

export async function listMyRooms(userId: string) {
  const memberships = await prisma.roomMembership.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      room: {
        include: {
          _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    id: m.room.id,
    name: m.room.name,
    type: m.room.type,
    imageUrl: m.room.imageUrl,
    currency: m.room.currency,
    memberCount: m.room._count.memberships,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function getRoomDetail(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
      _count: { select: { expenses: true } },
    },
  });

  if (!room) throw ApiError.notFound("Room not found");
  return room;
}

export async function updateRoom(roomId: string, userId: string, input: UpdateRoomInput) {
  const before = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: input,
  });

  await logActivity({
    roomId,
    actorId: userId,
    action: "UPDATE",
    entityType: "Room",
    entityId: roomId,
    previousValue: JSON.parse(JSON.stringify(before)),
    newValue: JSON.parse(JSON.stringify(updated)),
  });

  return updated;
}

export async function createInvitation(roomId: string, invitedById: string, input: CreateInvitationInput) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });

  const memberCount = await prisma.roomMembership.count({
    where: { roomId, status: "ACTIVE" },
  });
  if (memberCount >= room.memberLimit) {
    throw ApiError.badRequest("This room has reached its member limit");
  }

  const invitation = await prisma.invitation.create({
    data: {
      roomId,
      invitedById,
      email: input.email,
      role: input.role,
      code: generateSecureToken(),
      expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
    },
  });

  if (input.email) {
    sendInvitationEmail(input.email, room.name, invitation.code);
  }

  await logActivity({
    roomId,
    actorId: invitedById,
    action: "INVITE",
    entityType: "Invitation",
    entityId: invitation.id,
    newValue: { email: input.email, role: input.role },
  });

  return invitation;
}

export async function listInvitations(roomId: string) {
  return prisma.invitation.findMany({
    where: { roomId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvitation(roomId: string, invitationId: string, actorId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.roomId !== roomId) {
    throw ApiError.notFound("Invitation not found");
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "Invitation",
    entityId: invitationId,
    newValue: { status: "REVOKED" },
  });
}

export async function joinRoomByCode(userId: string, code: string) {
  const invitation = await prisma.invitation.findUnique({ where: { code }, include: { room: true } });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    // Also allow joining directly via a room's permanent inviteCode.
    const room = await prisma.room.findUnique({ where: { inviteCode: code } });
    if (!room) throw ApiError.badRequest("This invitation link is invalid or has expired.");
    return joinRoomDirect(userId, room.id);
  }

  const existing = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId: invitation.roomId, userId } },
  });
  if (existing && existing.status === "ACTIVE") {
    throw ApiError.conflict("You're already a member of this room");
  }

  const memberCount = await prisma.roomMembership.count({
    where: { roomId: invitation.roomId, status: "ACTIVE" },
  });
  if (memberCount >= invitation.room.memberLimit) {
    throw ApiError.badRequest("This room has reached its member limit");
  }

  const membership = await prisma.$transaction(async (tx) => {
    const m = existing
      ? await tx.roomMembership.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", role: invitation.role, joinedAt: new Date(), leftAt: null },
        })
      : await tx.roomMembership.create({
          data: { roomId: invitation.roomId, userId, role: invitation.role },
        });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    await logActivity({
      roomId: invitation.roomId,
      actorId: userId,
      action: "JOIN",
      entityType: "RoomMembership",
      entityId: m.id,
      tx,
    });

    return m;
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await notifyRoomMembers({
    roomId: invitation.roomId,
    excludeUserId: userId,
    type: "MEMBER_JOINED",
    title: "New roommate joined",
    body: `${user.name} joined the room`,
  });

  return { roomId: invitation.roomId, membership };
}

async function joinRoomDirect(userId: string, roomId: string) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });

  const existing = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (existing && existing.status === "ACTIVE") {
    throw ApiError.conflict("You're already a member of this room");
  }

  const memberCount = await prisma.roomMembership.count({ where: { roomId, status: "ACTIVE" } });
  if (memberCount >= room.memberLimit) {
    throw ApiError.badRequest("This room has reached its member limit");
  }

  const membership = existing
    ? await prisma.roomMembership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", joinedAt: new Date(), leftAt: null },
      })
    : await prisma.roomMembership.create({
        data: { roomId, userId, role: RoomRole.ROOMMATE },
      });

  await logActivity({
    roomId,
    actorId: userId,
    action: "JOIN",
    entityType: "RoomMembership",
    entityId: membership.id,
  });

  return { roomId, membership };
}

export async function updateMember(
  roomId: string,
  membershipId: string,
  actorId: string,
  input: { role?: RoomRole; status?: "ACTIVE" | "SUSPENDED" },
) {
  const membership = await prisma.roomMembership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.roomId !== roomId) {
    throw ApiError.notFound("Member not found");
  }

  if (membership.userId === actorId && input.role && input.role !== membership.role) {
    throw ApiError.badRequest("You can't change your own role");
  }

  const updated = await prisma.roomMembership.update({
    where: { id: membershipId },
    data: { role: input.role, status: input.status },
  });

  await logActivity({
    roomId,
    actorId,
    action: input.status === "SUSPENDED" ? "SUSPEND" : "ROLE_CHANGE",
    entityType: "RoomMembership",
    entityId: membershipId,
    previousValue: { role: membership.role, status: membership.status },
    newValue: { role: updated.role, status: updated.status },
  });

  return updated;
}

export async function removeMember(roomId: string, membershipId: string, actorId: string) {
  const membership = await prisma.roomMembership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.roomId !== roomId) {
    throw ApiError.notFound("Member not found");
  }
  if (membership.userId === actorId) {
    throw ApiError.badRequest("You can't remove yourself. Leave the room instead.");
  }

  await prisma.roomMembership.update({
    where: { id: membershipId },
    data: { status: "REMOVED", leftAt: new Date() },
  });

  await logActivity({
    roomId,
    actorId,
    action: "REMOVE",
    entityType: "RoomMembership",
    entityId: membershipId,
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) throw ApiError.notFound("Membership not found");

  if (membership.role === "ADMIN") {
    const otherAdmins = await prisma.roomMembership.count({
      where: { roomId, role: "ADMIN", status: "ACTIVE", userId: { not: userId } },
    });
    if (otherAdmins === 0) {
      throw ApiError.badRequest(
        "You're the only admin. Promote another member to admin before leaving.",
      );
    }
  }

  await prisma.roomMembership.update({
    where: { id: membership.id },
    data: { status: "LEFT", leftAt: new Date() },
  });

  await logActivity({
    roomId,
    actorId: userId,
    action: "LEAVE",
    entityType: "RoomMembership",
    entityId: membership.id,
  });
}
