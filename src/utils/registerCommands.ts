import { REST, Routes } from "discord.js";
import { config } from "../env";
import { commands } from "../commands/index";

const commandsData = Object.values(commands).map((command) => command.data.toJSON());

export async function registerCommands() {
  try {
    const guildId = config.discord.guildId;
    const scope = guildId ? `guild ${guildId}` : "global";
    console.log(`Started refreshing ${commandsData.length} ${scope} application commands.`);

    const rest = new REST({ version: "10" }).setToken(config.discord.token);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(config.discord.clientId, guildId), {
        body: commandsData,
      });
    } else {
      await rest.put(Routes.applicationCommands(config.discord.clientId), {
        body: commandsData,
      });
    }

    console.log(`Successfully reloaded ${commandsData.length} ${scope} commands.`);
  } catch (error) {
    console.error(error);
  }
}
