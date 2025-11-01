import { Events } from "discord.js";
import { createEvent } from "../helpers.js";

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  }
);
