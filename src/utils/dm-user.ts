import type { User } from "discord.js";
import type { ActionType } from "../../generated/prisma/index.js";
import { getActionEmoji, getActionTypeName } from "./action-helpers.js";

interface SendActionDMOptions {
  user: User;
  actionType: ActionType;
  reason: string;
  note?: string | null;
  guildName?: string;
  actionId: number;
}

interface DMResult {
  success: boolean;
  message: string;

  error?: string;
}

/**
 * Send a DM to a user informing them of a moderation action
 * @returns Object with success status and optional error message
 */
export async function sendActionDM(options: SendActionDMOptions): Promise<DMResult> {
  const { user, actionType, reason, note, guildName, actionId } = options;

  try {
    const emoji = getActionEmoji(actionType);
    const actionName = getActionTypeName(actionType);
    const serverName = guildName || "the server";

    // Build the embed
    const embed = {
      color: 0xe74c3c, // red-ish color for alert (customize as desired)
      title: `${emoji} ${actionName}`,
      description: `You have received a **${actionName.toLowerCase()}** in **${serverName}**.`,
      fields: [
        {
          name: "Reason",
          value: reason,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Action ID: #${actionId}\nIf you have questions about this action, you may contact the server moderators.`,
      },
    };

    if (note) {
      embed.fields.push({
        name: "Details",
        value: note,
        inline: true,
      });
    }

    await user.send({ embeds: [embed] });
    return { success: true, message: "✅ User was notified via DM" };
  } catch (error) {
    // Common reasons for failure:
    // - User has DMs disabled
    // - User has blocked the bot
    // - User is not in a mutual server
    if (error instanceof Error) {
      console.error("Error sending DM to user:", error.message);
      return {
        success: false,
        message: "⚠️ Could not send DM to user (they may have DMs disabled)",
      };
    }
    console.error("Error sending DM to user: Unknown error");
    return {
      success: false,
      message: "⚠️ Could not send DM to user (they may have DMs disabled)",
    };
  }
}
