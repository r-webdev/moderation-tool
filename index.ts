import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { config } from "./env.js";
import { loadCommands } from "./src/utils/loadCommands.js";
import { registerCommands } from "./src/utils/registerCommands.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

loadCommands(client);
registerCommands();

client.on(Events.InteractionCreate, async (interaction) => {
  /**
   * Slash Commands
   */
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.log(`Command not found ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `There was an error while executing the ${interaction.commandName} command.`,
        ephemeral: true,
      });
      console.log(`Error executing command ${interaction.commandName}`);
      console.error(error);
    }
    return;
  }

  /**
   * Message Context Menu Commands
   */
  if (interaction.isMessageContextMenuCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.log(`Command not found ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      try {
        await interaction.reply({
          content: `There was an error while executing the ${interaction.commandName} command.`,
          ephemeral: true,
        });
      } catch {
        console.log(`Error replying to interaction ${interaction.commandName}`);
      }
    }
  }
});

/**
 * Client Ready
 */
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(config.discord.token);
