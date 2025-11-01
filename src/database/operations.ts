import { ActionStatus, type ActionType, PrismaClient } from "../../generated/prisma/index.js";

export const prisma = new PrismaClient();

// Connect to database and verify connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    // Test query to verify connection
    await prisma.user.findFirst();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

// Disconnect from database
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

// User operations - only Discord ID needed
export async function upsertUser(discordId: string) {
  return await prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });
}

export async function getUserByDiscordId(discordId: string) {
  return await prisma.user.findUnique({
    where: { discordId },
  });
}

// Moderation action operations
type CreateActionParams = {
  type: ActionType;
  targetDiscordId: string;
  moderatorDiscordId: string;
  reason?: string;
  duration?: number;
};

export async function createModerationAction(params: CreateActionParams) {
  // Ensure both users exist
  const target = await upsertUser(params.targetDiscordId);
  const moderator = await upsertUser(params.moderatorDiscordId);

  // Calculate expiry for timed actions
  const expiresAt = params.duration ? new Date(Date.now() + params.duration * 1000) : null;

  return await prisma.moderationAction.create({
    data: {
      type: params.type,
      reason: params.reason,
      duration: params.duration,
      targetId: target.id,
      moderatorId: moderator.id,
      expiresAt,
    },
    include: {
      target: true,
      moderator: true,
    },
  });
}

export async function removeActionByError(
  actionId: number,
  removedByDiscordId: string,
  reason: string
) {
  const removedBy = await upsertUser(removedByDiscordId);

  // Mark original action as removed
  const originalAction = await prisma.moderationAction.update({
    where: { id: actionId },
    data: { status: ActionStatus.REMOVED_BY_ERROR },
  });

  // Create correction record
  return await prisma.moderationAction.create({
    data: {
      type: originalAction.type,
      status: ActionStatus.REMOVED_BY_ERROR,
      reason: `Correction: ${reason}`,
      targetId: originalAction.targetId,
      moderatorId: removedBy.id,
      parentActionId: originalAction.id,
    },
    include: {
      parentAction: true,
    },
  });
}

export async function getUserActions(discordId: string, limit = 50) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    return [];
  }

  return await prisma.moderationAction.findMany({
    where: { targetId: user.id },
    include: {
      moderator: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getActiveActions(discordId: string) {
  const user = await getUserByDiscordId(discordId);
  if (!user) {
    return [];
  }

  return await prisma.moderationAction.findMany({
    where: {
      targetId: user.id,
      status: ActionStatus.ACTIVE,
    },
    include: {
      moderator: true,
    },
  });
}

export async function getActionById(actionId: number) {
  return await prisma.moderationAction.findUnique({
    where: { id: actionId },
    include: {
      target: true,
      moderator: true,
      parentAction: true,
    },
  });
}

export async function updateActionStatus(actionId: number, status: ActionStatus) {
  return await prisma.moderationAction.update({
    where: { id: actionId },
    data: { status },
  });
}
