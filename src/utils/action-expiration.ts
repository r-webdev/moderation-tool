import type { Client } from "discord.js";
import { ActionStatus } from "../../generated/prisma/index.js";
import { revertAction } from "./action-revert.js";
import { db } from "./db.js";

interface ExpirationStats {
  total: number;
  succeeded: number;
  failed: number;
}

/**
 * Process all expired actions by marking them as STALE and reverting temporary ones
 * This function is called periodically by the cron job
 * @param client The Discord client
 * @returns Statistics about processed actions
 */
export async function processExpiredActions(client: Client): Promise<ExpirationStats> {
  const stats: ExpirationStats = {
    total: 0,
    succeeded: 0,
    failed: 0,
  };

  try {
    console.log("🔍 Checking for expired actions...");

    const now = Math.floor(Date.now() / 1000);

    // Query for ACTIVE actions that have expired
    const expiredActions = await db.action.findMany({
      where: {
        status: ActionStatus.ACTIVE,
        expiresAt: {
          not: null,
          lte: now,
        },
      },
      include: {
        user: true,
        moderator: true,
      },
    });

    stats.total = expiredActions.length;

    if (expiredActions.length === 0) {
      console.log("✅ No expired actions found");
      return stats;
    }

    console.log(`📋 Found ${expiredActions.length} expired action(s)`);

    // Process each expired action
    for (const action of expiredActions) {
      try {
        const result = await revertAction(action.actionId, client, {
          reason: "Action expired automatically",
          isAutomatic: true,
        });

        if (result.success) {
          stats.succeeded++;
          console.log(`✅ Processed expired action #${action.actionId} (${action.type})`);
        } else {
          stats.failed++;
          console.error(`❌ Failed to process action #${action.actionId}: ${result.error}`);
        }
      } catch (error) {
        stats.failed++;
        console.error(`❌ Error processing action #${action.actionId}:`, error);
      }
    }

    console.log(
      `📊 Expiration check complete: ${stats.succeeded} succeeded, ${stats.failed} failed out of ${stats.total} total`
    );

    return stats;
  } catch (error) {
    console.error("❌ Critical error during expiration check:", error);
    return stats;
  }
}
