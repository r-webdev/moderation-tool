import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { ActionReason, ActionType } from "../../../generated/prisma/index.js";
import { config } from "../../env.js";
import { createActionDetails, createActionNotification } from "../../utils/action-embeds.js";
import { BAN_TYPE_CHOICES, REASON_CHOICES } from "../../utils/action-helpers.js";
import { createAction, getDefaultExpiration } from "../../utils/actions.js";
import { createSlashCommand } from "../helpers.js";

export const ban = createSlashCommand({
  data: {
    name: "ban",
    description: "Ban a user from the server",
    options: [
      {
        name: "user",
        description: "The user to ban",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "type",
        description: "Ban type (permanent or temporary)",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: BAN_TYPE_CHOICES,
      },
      {
        name: "reason",
        description: "The reason for the ban",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: REASON_CHOICES,
      },
      {
        name: "duration",
        description: "Duration in days (only for temporary bans)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
        max_value: 365,
      },
      {
        name: "note",
        description: "Additional note for the ban",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    const targetUser = interaction.options.getUser("user", true);
    const banType = interaction.options.getString("type", true);
    const reason = interaction.options.getString("reason", true) as ActionReason;
    const duration = interaction.options.getInteger("duration");
    const customNote = interaction.options.getString("note");

    // Validation: If reason is OTHER, note must be provided
    if (reason === ActionReason.OTHER && !customNote) {
      await interaction.reply({
        content: "❌ When reason is 'Other', you must provide a note explaining the ban.",
        ephemeral: true,
      });
      return;
    }

    // Validation: If temporary ban, duration must be provided
    if (banType === "temporary" && !duration) {
      await interaction.reply({
        content: "❌ You must provide a duration for temporary bans.",
        ephemeral: true,
      });
      return;
    }

    // Construct the note based on requirements
    let finalNote: string;
    const reasonText = reason.toLowerCase().replace(/_/g, " ");

    if (!customNote) {
      // Only reason provided
      finalNote = `Banned for ${reasonText}`;
    } else {
      // Both reason and note provided
      finalNote = `Banned for ${reasonText}: ${customNote}`;
    }

    // Determine action type and expiration
    const actionType = banType === "permanent" ? ActionType.BAN : ActionType.TEMP_BAN;
    let expiresAt: number | undefined;

    if (banType === "temporary" && duration) {
      // Calculate expiration for temporary ban
      const now = Date.now();
      const daysInMs = duration * 24 * 60 * 60 * 1000;
      expiresAt = Math.floor((now + daysInMs) / 1000);
    } else {
      // Permanent ban - use default expiration based on reason
      expiresAt = getDefaultExpiration(reason);
    }

    try {
      // Defer reply as database and ban operations might take time
      await interaction.deferReply();

      // Ban the user from the guild
      const member = await interaction.guild?.members.fetch(targetUser.id);
      if (!member) {
        await interaction.editReply({
          content: "❌ Could not find the user in this server.",
        });
        return;
      }

      // Execute the ban
      await member.ban({
        reason: finalNote,
      });

      // Create the action in the database
      const action = await createAction({
        userId: targetUser.id,
        moderatorUserId: interaction.user.id,
        type: actionType,
        reason,
        note: finalNote,
        expiresAt,
      });

      const notificationEmbed = createActionNotification({
        user: targetUser,
        actionType,
        reason,
      });

      // Send notification embed as confirmation
      try {
        await interaction.followUp({
          embeds: [notificationEmbed],
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
      }
    } catch (error) {
      console.error("Error creating ban action:", error);
      await interaction.followUp({
        content: "❌ An error occurred while issuing the ban. Please try again later.",
        ephemeral: true,
      });
    }
  },
});
