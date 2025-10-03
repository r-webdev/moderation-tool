import type { MessageContextMenuCommandInteraction } from "discord.js";
import {
  ApplicationCommandType,
  ChannelType,
  ContextMenuCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "./types.js";

const data = new ContextMenuCommandBuilder()
  .setName("Report to Moderators")
  .setType(ApplicationCommandType.Message); // ApplicationCommandType.Message = 3

async function execute(interaction: MessageContextMenuCommandInteraction) {
  const targetMessage = interaction.targetMessage;
  const guild = interaction.guild;
  const reporter = interaction.user;

  if (!guild) {
    await interaction.reply({ content: "This can only be used in a server.", ephemeral: true });
    return;
  }

  try {
    const channelId = "1407649112228368474";
    const channel = await guild.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "Moderator channel not found or is not a text channel.",
        ephemeral: true,
      });
      return;
    }

    const jumpLink = targetMessage.url;
    const authorTag = targetMessage.author?.tag ?? "Unknown";
    const authorId = targetMessage.author?.id ?? "Unknown";

    const embed = new EmbedBuilder()
      .setTitle("🚩 Message Report")
      .setColor(0xff4d4f)
      .setTimestamp()
      .setURL(jumpLink)
      .addFields(
        { name: "Reporter", value: `<@${reporter.id}>`, inline: true },
        { name: "Message Link", value: `[Jump to message](${jumpLink})`, inline: true },
        { name: "Message ID", value: targetMessage.id, inline: true },
        { name: "Username", value: authorTag, inline: true },
        { name: "User ID", value: authorId, inline: true },
        { name: "Linked User", value: `<@${authorId}>`, inline: true }
      );

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: "Thanks. The message was reported to moderators.",
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Failed to report the message.", ephemeral: true });
  }
}

export const reportMessage: Command<MessageContextMenuCommandInteraction> = {
  data,
  execute,
};
