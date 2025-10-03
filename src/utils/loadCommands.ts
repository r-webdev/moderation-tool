import { type Client, Collection } from "discord.js";
import { commands } from "../commands/index.js";
import type { Command } from "../commands/types.js";

function isCommandLike(value: unknown): value is Command {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in (value as Record<string, unknown>) &&
    "execute" in (value as Record<string, unknown>)
  );
}

export async function loadCommands(client: Client) {
  if (!client.commands) {
    client.commands = new Collection<string, Command>();
  }

  let loaded = 0;
  for (const [key, value] of Object.entries(commands)) {
    if (isCommandLike(value)) {
      client.commands.set(key, value);
      loaded += 1;
    } else {
      console.warn(`[WARNING] Command '${key}' from barrel file is missing required properties.`);
    }
  }

  console.log(`Successfully loaded ${loaded} command handlers into client.commands.`);
}
