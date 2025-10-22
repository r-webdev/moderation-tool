import { createSlashCommand } from "../helpers.js";

export const ping = createSlashCommand({
  data: {
    name: "ping",
    description: "Replies with Pong!",
  },
  execute: async (interaction) => {
    const startTime = Date.now();

    await interaction.deferReply();

    const responseTime = Date.now() - startTime;
    const wsPing = interaction.client.ws.ping;

    await interaction.editReply(`🏓 Pong! Response: ${responseTime}ms | WebSocket: ${wsPing}ms`);
  },
});
