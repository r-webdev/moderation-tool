import {
  ActionStatus,
  type ActionType,
  type ModerationAction,
} from "../../generated/prisma/index.js";
import { prisma } from "./operations.js";

export async function getUserActionStats(discordId: string) {
  const user = await prisma.user.findUnique({
    where: { discordId },
    include: {
      actionsReceived: {
        where: {
          status: { in: [ActionStatus.ACTIVE, ActionStatus.EXPIRED] },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const actionsByType = user.actionsReceived.reduce(
    (acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    },
    {} as Record<ActionType, number>
  );

  return {
    discordId: user.discordId,
    totalActions: user.actionsReceived.length,
    actionsByType,
  };
}

export async function getModeratorStats(discordId: string, days = 30) {
  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    return null;
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const actions = await prisma.moderationAction.findMany({
    where: {
      moderatorId: user.id,
      createdAt: { gte: since },
      status: { not: ActionStatus.REMOVED_BY_ERROR },
    },
  });

  const actionsByType = actions.reduce(
    (acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    },
    {} as Record<ActionType, number>
  );

  return {
    discordId: user.discordId,
    totalActions: actions.length,
    actionsByType,
    period: `${days} days`,
  };
}

export async function getRecentActions(limit = 20) {
  return await prisma.moderationAction.findMany({
    include: {
      target: true,
      moderator: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findRepeatOffenders(minActions = 3) {
  const actions = await prisma.moderationAction.findMany({
    where: {
      status: { in: [ActionStatus.ACTIVE, ActionStatus.EXPIRED] },
    },
    include: {
      target: true,
    },
  });

  const userActionCounts = actions.reduce(
    (acc, action) => {
      const discordId = action.target.discordId;
      if (!acc[discordId]) {
        acc[discordId] = { discordId, count: 0, actions: [] };
      }
      acc[discordId].count++;
      acc[discordId].actions.push(action);
      return acc;
    },
    {} as Record<string, { discordId: string; count: number; actions: ModerationAction[] }>
  );

  return Object.values(userActionCounts)
    .filter((item) => item.count >= minActions)
    .sort((offenderA, offenderB) => offenderB.count - offenderA.count);
}

export async function getActionsByType(actionType: ActionType, limit = 50) {
  return await prisma.moderationAction.findMany({
    where: { type: actionType },
    include: {
      target: true,
      moderator: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getTotalActionCount() {
  return await prisma.moderationAction.count({
    where: {
      status: { not: ActionStatus.REMOVED_BY_ERROR },
    },
  });
}
