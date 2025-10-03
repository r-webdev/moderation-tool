import { REST, Routes } from "discord.js";
import { config } from "../../env";
import { commands } from "../commands";

const commandsData = Object.values(commands).map((command) => command.data.toJSON());

export async function registerCommands() {
  try {
    console.log(`Started refreshing ${commandsData.length} application (/) commands.`);

    const rest = new REST({ version: "10" }).setToken(config.discord.token);

    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: commandsData,
    });

    console.log(`Successfully reloaded ${commandsData.length} globally (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}
