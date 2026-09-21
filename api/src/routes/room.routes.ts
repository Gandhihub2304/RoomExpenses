import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { validateBody } from "@/middleware/validate";
import { requireAuth } from "@/middleware/require-auth";
import { requireRoomMembership, requireRoomAdmin } from "@/middleware/require-room-membership";
import { ApiError } from "@/utils/api-error";
import { prisma } from "@/lib/prisma";
import {
  createRoomSchema,
  updateRoomSchema,
  joinRoomSchema,
  createInvitationSchema,
  updateMemberSchema,
} from "@/validators/room";
import * as roomService from "@/services/room.service";

export const roomRouter = Router();

roomRouter.use(requireAuth);

roomRouter.post(
  "/",
  validateBody(createRoomSchema),
  asyncHandler(async (req, res) => {
    const room = await roomService.createRoom(req.userId!, req.body);
    res.status(201).json({ data: room });
  }),
);

roomRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rooms = await roomService.listMyRooms(req.userId!);
    res.json({ data: rooms });
  }),
);

roomRouter.post(
  "/join",
  validateBody(joinRoomSchema),
  asyncHandler(async (req, res) => {
    const result = await roomService.joinRoomByCode(req.userId!, req.body.code);
    res.json({ data: result });
  }),
);

roomRouter.get(
  "/:roomId",
  requireRoomMembership(),
  asyncHandler(async (req, res) => {
    const room = await roomService.getRoomDetail(req.roomId!);
    res.json({ data: { ...room, myRole: req.roomRole } });
  }),
);

roomRouter.patch(
  "/:roomId",
  requireRoomAdmin(),
  validateBody(updateRoomSchema),
  asyncHandler(async (req, res) => {
    const room = await roomService.updateRoom(req.roomId!, req.userId!, req.body);
    res.json({ data: room });
  }),
);

roomRouter.post(
  "/:roomId/leave",
  requireRoomMembership(),
  asyncHandler(async (req, res) => {
    await roomService.leaveRoom(req.roomId!, req.userId!);
    res.json({ data: { success: true } });
  }),
);

// --- Invitations (admin only) -----------------------------------------

roomRouter.post(
  "/:roomId/invitations",
  requireRoomAdmin(),
  validateBody(createInvitationSchema),
  asyncHandler(async (req, res) => {
    const invitation = await roomService.createInvitation(req.roomId!, req.userId!, req.body);
    res.status(201).json({ data: invitation });
  }),
);

roomRouter.get(
  "/:roomId/invitations",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    const invitations = await roomService.listInvitations(req.roomId!);
    res.json({ data: invitations });
  }),
);

roomRouter.delete(
  "/:roomId/invitations/:invitationId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await roomService.revokeInvitation(req.roomId!, req.params.invitationId, req.userId!);
    res.json({ data: { success: true } });
  }),
);

// --- Members -------------------------------------------------------------

roomRouter.get(
  "/:roomId/members",
  requireRoomMembership(),
  asyncHandler(async (req, res) => {
    const members = await prisma.roomMembership.findMany({
      where: { roomId: req.roomId!, status: { in: ["ACTIVE", "SUSPENDED"] } },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { joinedAt: "asc" },
    });
    res.json({ data: members });
  }),
);

roomRouter.patch(
  "/:roomId/members/:membershipId",
  requireRoomAdmin(),
  validateBody(updateMemberSchema),
  asyncHandler(async (req, res) => {
    const updated = await roomService.updateMember(
      req.roomId!,
      req.params.membershipId,
      req.userId!,
      req.body,
    );
    res.json({ data: updated });
  }),
);

roomRouter.delete(
  "/:roomId/members/:membershipId",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    await roomService.removeMember(req.roomId!, req.params.membershipId, req.userId!);
    res.json({ data: { success: true } });
  }),
);

// --- Categories ------------------------------------------------------------

roomRouter.get(
  "/:roomId/categories",
  requireRoomMembership(),
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { roomId: req.roomId! },
      orderBy: { name: "asc" },
    });
    res.json({ data: categories });
  }),
);

roomRouter.post(
  "/:roomId/categories",
  requireRoomAdmin(),
  asyncHandler(async (req, res) => {
    const { name, icon, color } = req.body as { name: string; icon?: string; color?: string };
    if (!name || name.trim().length < 2) {
      throw ApiError.badRequest("Category name is required");
    }
    const category = await prisma.category.create({
      data: { roomId: req.roomId!, name: name.trim(), icon: icon ?? "tag", color: color ?? "#6366f1" },
    });
    res.status(201).json({ data: category });
  }),
);
