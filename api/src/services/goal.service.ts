import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/api-error";
import { logActivity } from "@/services/activity-log.service";
import { notifyRoomMembers } from "@/services/notification.service";
import { getBudgetForMonth } from "@/services/budget.service";
import type { CreateGoalInput, AddContributionInput } from "@/validators/goal";

export async function getActiveGoal(roomId: string) {
  const goal = await prisma.goal.findFirst({
    where: { roomId, isActive: true },
    include: {
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { addedBy: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return goal;
}

export async function listGoalHistory(roomId: string) {
  return prisma.goal.findMany({
    where: { roomId, isActive: false },
    orderBy: { reachedAt: "desc" },
  });
}

export async function createGoal(roomId: string, createdById: string, input: CreateGoalInput) {
  const existing = await prisma.goal.findFirst({ where: { roomId, isActive: true } });
  if (existing) {
    throw ApiError.conflict("This room already has an active goal. Complete or cancel it first.");
  }

  const goal = await prisma.goal.create({
    data: {
      roomId,
      name: input.name,
      targetAmount: input.targetAmount,
      createdById,
    },
  });

  await logActivity({
    roomId,
    actorId: createdById,
    action: "CREATE",
    entityType: "Goal",
    entityId: goal.id,
    newValue: { name: goal.name, targetAmount: goal.targetAmount.toString() },
  });

  await notifyRoomMembers({
    roomId,
    excludeUserId: createdById,
    type: "ROOM_ANNOUNCEMENT",
    title: "New room goal set",
    body: `Saving up for "${goal.name}" — target ${goal.targetAmount.toString()}`,
    metadata: { goalId: goal.id },
  });

  return goal;
}

/**
 * Suggests this month's contribution as leftover budget (budget - actual
 * spend), falling back to the room's default monthlyBudget when no
 * dedicated Budget record exists for the month. Never negative.
 */
export async function suggestContribution(roomId: string, month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const budgetSummary = await getBudgetForMonth(roomId, targetMonth, targetYear);

  let totalAmount = budgetSummary.totalAmount;
  if (!totalAmount) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    totalAmount = room?.monthlyBudget?.toString() ?? null;
  }

  if (!totalAmount) {
    return { suggestedAmount: "0", month: targetMonth, year: targetYear, reason: "no_budget_set" as const };
  }

  const leftover = new Decimal(totalAmount).minus(budgetSummary.totalSpend);
  const suggestedAmount = leftover.greaterThan(0) ? leftover.toDecimalPlaces(2) : new Decimal(0);

  return {
    suggestedAmount: suggestedAmount.toString(),
    month: targetMonth,
    year: targetYear,
    reason: "leftover_budget" as const,
  };
}

export async function addContribution(
  roomId: string,
  actorId: string,
  input: AddContributionInput,
) {
  const goal = await prisma.goal.findFirst({ where: { roomId, isActive: true } });
  if (!goal) throw ApiError.badRequest("This room doesn't have an active goal");

  const existing = await prisma.goalContribution.findUnique({
    where: { goalId_month_year: { goalId: goal.id, month: input.month, year: input.year } },
  });
  if (existing) {
    throw ApiError.conflict("A contribution has already been recorded for this month");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.goalContribution.create({
      data: {
        goalId: goal.id,
        amount: input.amount,
        month: input.month,
        year: input.year,
        note: input.note,
        addedById: actorId,
      },
    });

    const newSaved = goal.savedAmount.plus(input.amount);
    const justReached = !goal.reachedAt && newSaved.greaterThanOrEqualTo(goal.targetAmount);

    const updatedGoal = await tx.goal.update({
      where: { id: goal.id },
      data: {
        savedAmount: newSaved,
        reachedAt: justReached ? new Date() : goal.reachedAt,
      },
    });

    await logActivity({
      roomId,
      actorId,
      action: "UPDATE",
      entityType: "Goal",
      entityId: goal.id,
      newValue: { savedAmount: newSaved.toString(), contribution: input.amount },
      tx,
    });

    return { updatedGoal, justReached };
  });

  await notifyRoomMembers({
    roomId,
    type: "GOAL_CONTRIBUTION",
    title: "Goal contribution added",
    body: `${input.amount} added to "${goal.name}" — ${result.updatedGoal.savedAmount.toString()} of ${goal.targetAmount.toString()} saved`,
    metadata: { goalId: goal.id },
  });

  if (result.justReached) {
    await notifyRoomMembers({
      roomId,
      type: "GOAL_REACHED",
      title: "Goal unlocked!",
      body: `"${goal.name}" is fully funded — you can buy it now!`,
      metadata: { goalId: goal.id },
    });
  }

  return { ...result.updatedGoal, justReached: result.justReached };
}

export async function completeGoal(roomId: string, goalId: string, actorId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.roomId !== roomId) throw ApiError.notFound("Goal not found");

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { isActive: false },
  });

  await logActivity({
    roomId,
    actorId,
    action: "UPDATE",
    entityType: "Goal",
    entityId: goalId,
    newValue: { isActive: false },
  });

  return updated;
}

export async function cancelGoal(roomId: string, goalId: string, actorId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.roomId !== roomId) throw ApiError.notFound("Goal not found");
  if (goal.isActive === false) throw ApiError.badRequest("This goal is already inactive");

  await prisma.goal.update({ where: { id: goalId }, data: { isActive: false } });

  await logActivity({
    roomId,
    actorId,
    action: "DELETE",
    entityType: "Goal",
    entityId: goalId,
  });
}
