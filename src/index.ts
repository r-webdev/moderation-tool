import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./env.js";
import { loadCommands, registerCommands } from "./utils/commands.js";
import { loadEvents } from "./utils/events.js";

const client = new Client({
  intents:
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent |
    GatewayIntentBits.GuildModeration |
    GatewayIntentBits.GuildMembers,
});

loadCommands(client);
loadEvents(client);
registerCommands();

client.login(config.discord.token);
