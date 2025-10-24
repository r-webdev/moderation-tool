import {
  type ChatInputCommandInteraction,
  type Client,
  Collection,
  REST,
  Routes,
} from "discord.js";
import { commands } from "../commands/index.js";
import type { Command } from "../commands/types.js";
import { config } from "../env.js";

export const buildCommandString = (interaction: ChatInputCommandInteraction): string => {
  const commandName = interaction.commandName;
  return `/${commandName} ${interaction.options.data
    .map((option) => `${option.name}:${option.value}`)
    .join(" ")}`;
};

export async function loadCommands(client: Client) {
  if (!client.commands) {
    client.commands = new Collection<string, Command>();
  }

  let loaded = 0;
  for (const command of commands.values()) {
    client.commands.set(command.data.name, command);
    loaded += 1;
  }

  console.log(`Successfully loaded ${loaded} command handlers into client.commands.`);
}

export async function registerCommands() {
  const commandsData = Array.from(commands.values()).map((command) => command.data);

  try {
    const guildId = config.discord.serverId;
    const scope = guildId ? `guild ${guildId}` : "global";
    console.log(`Started refreshing ${commandsData.length} ${scope} application commands.`);

    const rest = new REST({ version: "10" }).setToken(config.discord.token);

    await rest.put(Routes.applicationGuildCommands(config.discord.clientId, guildId), {
      body: commandsData,
    });

    console.log(`Successfully reloaded ${commandsData.length} ${scope} commands.`);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
}
