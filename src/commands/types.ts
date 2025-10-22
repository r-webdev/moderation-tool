import type {
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  UserContextMenuCommandInteraction,
} from "discord.js";

export type UserContextMenuCommand = {
  data: RESTPostAPIContextMenuApplicationCommandsJSONBody;
  execute: (interaction: UserContextMenuCommandInteraction) => Promise<void> | void;
};

export type MessageContextMenuCommand = {
  data: RESTPostAPIContextMenuApplicationCommandsJSONBody;
  execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void> | void;
};

export type SlashCommand = {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
};

export type ContextMenuCommand = UserContextMenuCommand | MessageContextMenuCommand;
export type Command = SlashCommand | ContextMenuCommand;
