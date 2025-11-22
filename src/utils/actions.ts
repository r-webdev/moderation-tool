import type { Action, ActionReason, ActionType } from "../../generated/prisma/index.js";
import { db } from "./db.js";

/**
 * Get default expiration time based on the severity of the action reason
 * @param reason The action reason
 * @returns Timestamp for expiration (in seconds since epoch)
 */
export const getDefaultExpiration = (reason: ActionReason): number => {
  const now = Date.now();
  const monthsToMs = (months: number) => months * 30 * 24 * 60 * 60 * 1000;

  const expirationMonths: Record<ActionReason, number> = {
    HATE_SPEECH: 12, // severe
    NSFW: 9, // severe
    SCAM: 9, // severe
    DISRUPTIVE: 6, // moderate
    SPAM: 3, // default
    SELF_PROMOTION: 3, // default
    JOB_POSTING: 3, // default
    FOR_HIRE: 3, // default
    OTHER: 3, // default
  };

  const months = expirationMonths[reason];
  const expirationTimestamp = now + monthsToMs(months);

  // Convert to seconds (Prisma schema uses Int for timestamps)
  return Math.floor(expirationTimestamp / 1000);
};

/**
 * Create a moderation action in the database
 * @param params Action parameters
 * @returns The created action record
 */
export const createAction = async (params: {
  userId: string;
  moderatorUserId: string;
  type: ActionType;
  reason: ActionReason;
  note?: string;
  expiresAt?: number;
}): Promise<Action> => {
  const { userId, moderatorUserId, type, reason, note, expiresAt } = params;

  // Find or create the target user
  const targetUser = await db.user.upsert({
    where: { discordUserId: userId },
    update: {},
    create: { discordUserId: userId },
  });

  // Find or create the moderator user
  const moderator = await db.user.upsert({
    where: { discordUserId: moderatorUserId },
    update: {},
    create: { discordUserId: moderatorUserId },
  });

  // Create the action
  const action = await db.action.create({
    data: {
      userId: targetUser.userId,
      moderatorUserId: moderator.userId,
      type,
      reason,
      note: note ?? null,
      createdAt: Math.floor(Date.now() / 1000), // Current timestamp in seconds
      expiresAt: expiresAt ?? null,
    },
  });

  return action;
};
