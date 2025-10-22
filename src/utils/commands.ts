import { ApplicationCommandType, type ChatInputCommandInteraction, type Client } from "discord.js";
import type {
  Command,
  MessageContextMenuCommand,
  SlashCommand,
  UserContextMenuCommand,
} from "../commands/types.js";

export const createSlashCommand = (command: {
  data: Omit<SlashCommand["data"], "type">;
  execute: SlashCommand["execute"];
}): SlashCommand => {
  return {
    data: {
      ...command.data,
      type: ApplicationCommandType.ChatInput,
    },
    execute: command.execute,
  };
};

export const createUserContextMenuCommand = (command: {
  data: Omit<UserContextMenuCommand["data"], "type">;
  execute: UserContextMenuCommand["execute"];
}): UserContextMenuCommand => {
  return {
    data: {
      ...command.data,
      type: ApplicationCommandType.User,
    },
    execute: command.execute,
  };
};

export const createMessageContextMenuCommand = (command: {
  data: Omit<MessageContextMenuCommand["data"], "type">;
  execute: MessageContextMenuCommand["execute"];
}): MessageContextMenuCommand => {
  return {
    data: {
      ...command.data,
      type: ApplicationCommandType.Message,
    },
    execute: command.execute,
  };
};

export const buildCommandString = (interaction: ChatInputCommandInteraction): string => {
  const commandName = interaction.commandName;
  return `/${commandName} ${interaction.options.data
    .map((option) => `${option.name}:${option.value}`)
    .join(" ")}`;
};
