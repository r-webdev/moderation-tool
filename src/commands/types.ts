import type {
  CommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export type Command<
  I extends CommandInteraction | MessageContextMenuCommandInteraction = CommandInteraction,
> = {
  data: SlashCommandBuilder | ContextMenuCommandBuilder;
  execute: (interaction: I) => Promise<void> | void;
};
