import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import type { CreateBillInput, UpdateBillInput } from "@/validators/bill";

async function refreshOverdueStatuses(roomId: string) {
  await prisma.bill.updateMany({
    where: { roomId, status: { in: ["UPCOMING", "DUE"] }, dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
}

export async function listBills(roomId: string) {
  await refreshOverdueStatuses(roomId);
  return prisma.bill.findMany({
    where: { roomId },
    include: { category: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export async function createBill(roomId: string, createdById: string, input: CreateBillInput) {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || category.roomId !== roomId) {
      throw ApiError.badRequest("Invalid category for this room");
    }
  }

  const status = input.dueDate < new Date() ? "OVERDUE" : "UPCOMING";

  const bill = await prisma.bill.create({
    data: {
      roomId,
      title: input.title,
      amount: input.amount,
      categoryId: input.categoryId,
      dueDate: input.dueDate,
      status,
      createdById,
    },
    include: { category: true },
  });

  await logActivity({
    roomId,
    actorId: createdById,
    action: "CREATE",
    entityType: "Bill",
    entityId: bill.id,
    newValue: { title: bill.title, amount: bill.amount.toString() },
  });

  await notifyRoomMembers({
    roomId,
    excludeUserId: createdById,
    type: "BILL_UPCOMING",
    title: "New bill added",
    body: `"${bill.title}" is due ${bill.dueDate.toLocaleDateString()}`,
    metadata: { billId: bill.id },
  });

  return bill;
}

export async function updateBill(roomId: string, billId: string, actorId: string, input: UpdateBillInput) {
  const existing = await prisma.bill.findUnique({ where: { id: billId } });
  if (!existing || existing.roomId !== roomId) throw ApiError.notFound("Bill not found");

  const updated = await prisma.bill.update({
    where: { id: billId },
    data: input,
    include: { category: true },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "Bill",
    entityId: billId,
    previousValue: { title: existing.title, amount: existing.amount.toString() },
    newValue: { title: updated.title, amount: updated.amount.toString() },
  });

  return updated;
}

export async function markBillPaid(roomId: string, billId: string, actorId: string, receiptUrl?: string) {
  const existing = await prisma.bill.findUnique({ where: { id: billId } });
  if (!existing || existing.roomId !== roomId) throw ApiError.notFound("Bill not found");

  const updated = await prisma.bill.update({
    where: { id: billId },
    data: { status: "PAID", paidAt: new Date(), receiptUrl },
    include: { category: true },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "Bill",
    entityId: billId,
    previousValue: { status: existing.status },
    newValue: { status: "PAID" },
  });

  return updated;
}

export async function deleteBill(roomId: string, billId: string, actorId: string) {
  const existing = await prisma.bill.findUnique({ where: { id: billId } });
  if (!existing || existing.roomId !== roomId) throw ApiError.notFound("Bill not found");

  await prisma.bill.delete({ where: { id: billId } });

  await logActivity({
    roomId,
    actorId,
    action: "DELETE",
    entityType: "Bill",
    entityId: billId,
  });
}
