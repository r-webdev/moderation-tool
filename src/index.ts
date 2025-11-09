import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./env.js";
import { loadCommands, registerCommands } from "./utils/commands.js";
import { loadEvents } from "./utils/events.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

loadCommands(client);
loadEvents(client);
registerCommands();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  process.exit(0);
});

client.login(config.discord.token);
