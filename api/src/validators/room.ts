import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.string().trim().min(2).max(40).default("Flat"),
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  currency: z.string().trim().length(3).default("INR"),
  timezone: z.string().trim().default("Asia/Kolkata"),
  monthlyBudget: z.coerce.number().nonnegative().optional(),
  memberLimit: z.coerce.number().int().min(1).max(50).default(10),
  rules: z.string().trim().max(1000).optional(),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const joinRoomSchema = z.object({
  code: z.string().trim().min(1),
});
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(["ADMIN", "ROOMMATE"]).default("ROOMMATE"),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "ROOMMATE"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
