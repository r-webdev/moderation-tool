import {
  ApplicationCommandOptionType,
  Colors,
  ContainerBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
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
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.ModerateMembers
    ).toJSON(),
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
    const commandUser = interaction.member;
    if (!(commandUser instanceof GuildMember)) {
      await interaction.reply({
        content: "This command can only be used in a server.",
      });
      return;
    }

    if (!commandUser.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await interaction.reply({
        content: "You do not have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    switch (subcommand) {
      case CommandOptions.STATS: {
        const stats = cachedMessages.getStats();

        const createStatComponent = (label: string, value: number) => {
          return new TextDisplayBuilder().setContent(`**${label}:** ${value}`);
        };

        const sizeComponent = createStatComponent("Total Cached Messages", stats.size);
        const userCountComponent = createStatComponent("Unique Users in Cache", stats.userCount);
        const channelCountComponent = createStatComponent(
          "Unique Channels in Cache",
          stats.channelCount
        );

        const containerComponent = new ContainerBuilder()
          .setAccentColor(Colors.Blue)
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
