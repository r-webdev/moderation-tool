import {
  ApplicationCommandOptionType,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { cachedMessages } from "../../cache/message-cache.js";
import { createSlashCommand } from "../helpers.js";

const CommandOptions = {
  STATS: "stats",
  CLEAR: "clear",
  REMOVE_EXPIRED: "remove-expired",
} as const;

export const messagesCacheCommand = createSlashCommand({
  data: {
    name: "messages-cache",
    description: "Manage the messages cache",
    options: [
      {
        name: CommandOptions.STATS,
        description: "Get cache statistics",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: CommandOptions.CLEAR,
        description: "Clear the messages cache",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: CommandOptions.REMOVE_EXPIRED,
        description: "Remove expired messages from the cache",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case CommandOptions.STATS: {
        const stats = cachedMessages.getStats();

        const createStatComponent = (label: string, value: number) =>
          new TextDisplayBuilder().setContent(`**${label}:** ${value}`);

        const sizeComponent = createStatComponent("Total Cached Messages", stats.size);
        const userCountComponent = createStatComponent("Unique Users in Cache", stats.userCount);
        const channelCountComponent = createStatComponent(
          "Unique Channels in Cache",
          stats.channelCount
        );

        const containerComponent = new ContainerBuilder()
          .setAccentColor(0x00ff00)
          .addTextDisplayComponents(sizeComponent)
          .addTextDisplayComponents(userCountComponent)
          .addTextDisplayComponents(channelCountComponent);

        await interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [containerComponent],
        });
        break;
      }
      case CommandOptions.CLEAR: {
        cachedMessages.clear();
        await interaction.reply({
          content: "Messages cache cleared.",
        });
        break;
      }
      case CommandOptions.REMOVE_EXPIRED: {
        cachedMessages.removeExpiredMessages();
        await interaction.reply({
          content: "Expired messages removed from cache.",
        });
        break;
      }
    }
    return;
  },
});
