import type { Client } from "discord.js";
import { ChannelType } from "discord.js";
import { ActionStatus, ActionType } from "../../generated/prisma/index.js";
import { config } from "../env.js";
import { createActionDetails } from "./action-embeds.js";
import type { ActionWithRelations } from "./actions.js";
import { createRevertAction } from "./actions.js";
import { db } from "./db.js";

interface RevertOptions {
  reason?: string;
  isAutomatic?: boolean;
}

interface RevertResult {
  success: boolean;
  error?: string;
  revertAction?: ActionWithRelations;
}

/**
 * Revert a moderation action by creating a REVERT action and removing Discord punishments
 * @param actionId The ID of the action to revert
 * @param client The Discord client
 * @param options Revert options (reason and whether it's automatic)
 * @returns Result object with success status and optional revert action
 */
export async function revertAction(
  actionId: number,
  client: Client,
  options: RevertOptions = {}
): Promise<RevertResult> {
  const { reason = "Action reverted", isAutomatic = false } = options;

  try {
    // Fetch the original action with relationships
    const originalAction = await db.action.findUnique({
      where: { actionId },
      include: {
        user: true,
        moderator: true,
      },
    });

    if (!originalAction) {
      return {
        success: false,
        error: `Action with ID ${actionId} not found`,
      };
    }

    // Check if action is already reverted or stale
    if (originalAction.status !== ActionStatus.ACTIVE) {
      return {
        success: false,
        error: `Action #${actionId} is already ${originalAction.status.toLowerCase()}`,
      };
    }

    // Get bot user ID
    if (!client.user) {
      return {
        success: false,
        error: "Bot user is not available",
      };
    }

    // Create the REVERT action
    const revertAction = await createRevertAction({
      originalActionId: actionId,
      moderatorUserId: client.user.id,
      note: reason,
    });

    // Update original action status based on context
    const newStatus = isAutomatic ? ActionStatus.STALE : ActionStatus.REVERTED;
    await db.action.update({
      where: { actionId },
      data: { status: newStatus },
    });

    // If it's a temporary action, remove the Discord punishment
    const isTemporaryAction =
      originalAction.type === ActionType.TEMP_BAN ||
      originalAction.type === ActionType.TEMP_MUTE ||
      originalAction.type === ActionType.TIMEOUT;

    if (isTemporaryAction) {
      await removeDiscordPunishment(originalAction, client);
    }

    // Post REVERT details to action log channel
    try {
      const logChannel = await client.channels.fetch(config.channels.actionLogId);
      if (logChannel && logChannel.type === ChannelType.GuildText) {
        const detailsEmbed = createActionDetails(revertAction);
        await logChannel.send({ embeds: [detailsEmbed] });
      }
    } catch (logError) {
      console.error("Error posting revert action to log channel:", logError);
      // Don't fail the entire revert if logging fails
    }

    console.log(
      `✅ Action #${actionId} ${isAutomatic ? "expired automatically" : "manually reverted"} (status: ${newStatus})`
    );

    return {
      success: true,
      revertAction,
    };
  } catch (error) {
    console.error(`Error reverting action #${actionId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove Discord punishment for temporary actions
 * @param action The action to remove punishment for
 * @param client The Discord client
 */
async function removeDiscordPunishment(action: ActionWithRelations, client: Client): Promise<void> {
  try {
    const guild = await client.guilds.fetch(config.discord.serverId);
    if (!guild) {
      console.error(`Guild with ID ${config.discord.serverId} not found`);
      return;
    }

    const userId = action.user.discordUserId;

    switch (action.type) {
      case ActionType.TEMP_BAN: {
        try {
          await guild.members.unban(userId, `Temporary ban expired (Action #${action.actionId})`);
          console.log(`✅ Unbanned user ${userId}`);
        } catch (error: unknown) {
          // Error code 10026 = Unknown Ban (user is not banned)
          if (error && typeof error === "object" && "code" in error && error.code === 10026) {
            console.log(`ℹ️ User ${userId} is not currently banned`);
          } else {
            console.error(`Error unbanning user ${userId}:`, error);
          }
        }
        break;
      }

      case ActionType.TEMP_MUTE: {
        try {
          const member = await guild.members.fetch(userId);
          if (member) {
            // Remove voice mute
            await member.voice.setMute(
              false,
              `Temporary mute expired (Action #${action.actionId})`
            );
            console.log(`✅ Unmuted user ${userId} in voice chat`);
          } else {
            console.log(`ℹ️ User ${userId} is not in the server (cannot unmute)`);
          }
        } catch (error: unknown) {
          // Error code 10007 = Unknown Member
          if (error && typeof error === "object" && "code" in error && error.code === 10007) {
            console.log(`ℹ️ User ${userId} is not in the server`);
          } else {
            console.error(`Error unmuting user ${userId}:`, error);
          }
        }
        break;
      }

      case ActionType.TIMEOUT: {
        try {
          const member = await guild.members.fetch(userId);
          if (member) {
            // Remove timeout
            await member.timeout(null, `Timeout expired (Action #${action.actionId})`);
            console.log(`✅ Removed timeout for user ${userId}`);
          } else {
            console.log(`ℹ️ User ${userId} is not in the server (cannot remove timeout)`);
          }
        } catch (error: unknown) {
          // Error code 10007 = Unknown Member
          if (error && typeof error === "object" && "code" in error && error.code === 10007) {
            console.log(`ℹ️ User ${userId} is not in the server`);
          } else {
            console.error(`Error removing timeout for user ${userId}:`, error);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Action type ${action.type} does not require Discord punishment removal`);
    }
  } catch (error) {
    console.error("Error removing Discord punishment:", error);
  }
}
