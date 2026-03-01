import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { ActionReason, ActionType } from "../../../generated/prisma/index.js";
import { config } from "../../env.js";
import { createActionDetails, createActionNotification } from "../../utils/action-embeds.js";
import { formatReason, REASON_CHOICES } from "../../utils/action-helpers.js";
import { createAction, getDefaultExpiration } from "../../utils/actions.js";
import { sendActionDM } from "../../utils/dm-user.js";
import { createSlashCommand } from "../helpers.js";

export const warn = createSlashCommand({
  data: {
    name: "warn",
    description: "Issue a warning to a user",
    options: [
      {
        name: "user",
        description: "The user to warn",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "The reason for the warning",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: REASON_CHOICES,
      },
      {
        name: "note",
        description: "Additional note for the warning",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true) as ActionReason;
    const customNote = interaction.options.getString("note");

    // Validation: If reason is OTHER, note must be provided
    if (reason === ActionReason.OTHER && !customNote) {
      await interaction.reply({
        content: "❌ When reason is 'Other', you must provide a note explaining the warning.",
        ephemeral: true,
      });
      return;
    }

    // Construct the note based on requirements
    let finalNote: string;
    const reasonText = reason.toLowerCase().replace(/_/g, " ");

    if (!customNote) {
      // Only reason provided
      finalNote = `Warned for ${reasonText}`;
    } else {
      // Both reason and note provided
      finalNote = `Warned for ${reasonText}: ${customNote}`;
    }

    // Get expiration based on reason severity
    const expiresAt = getDefaultExpiration(reason);

    try {
      // Defer reply as database operations might take time
      await interaction.deferReply();

      // Create the action in the database
      const action = await createAction({
        userId: targetUser.id,
        moderatorUserId: interaction.user.id,
        type: ActionType.WARN,
        reason,
        note: finalNote,
        expiresAt,
      });

      // Send DM to the user
      const dmResult = await sendActionDM({
        user: targetUser,
        actionType: ActionType.WARN,
        reason: formatReason(reason),
        note: customNote,
        guildName: interaction.guild?.name,
        actionId: action.actionId,
      });

      const notificationEmbed = createActionNotification({
        user: targetUser,
        actionType: ActionType.WARN,
        reason,
      });

      try {
        await interaction.followUp({
          embeds: [notificationEmbed],
          ephemeral: true,
        });
        // empheral message only the mod can see
        await interaction.followUp({
          content: dmResult.message,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error sending notification embed:", error);
        await interaction.followUp({
          content: "❌ An error occurred while sending the notification. Please try again later.",
          ephemeral: true,
        });
      }

      // Send verbose embed to action log channel
      try {
        const logChannel = await interaction.client.channels.fetch(config.channels.actionLogId);
        if (logChannel && logChannel.type === ChannelType.GuildText) {
          const detailsEmbed = createActionDetails(action, targetUser);
          await logChannel.send({ embeds: [detailsEmbed] });
        }
      } catch (logError) {
        console.error("Error sending to action log channel:", logError);
        await interaction.followUp({
          content: "❌ An error occurred while sending the action log. Please try again later.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error creating warning action:", error);
      await interaction.followUp({
        content: "❌ An error occurred while issuing the warning. Please try again later.",
        ephemeral: true,
      });
    }
  },
});
