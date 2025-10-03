import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "./types.js";

const data = new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");

async function execute(interaction: CommandInteraction) {
  const startTime = Date.now();

  await interaction.deferReply();

  const responseTime = Date.now() - startTime;
  const wsPing = interaction.client.ws.ping;

  await interaction.editReply(`🏓 Pong! Response: ${responseTime}ms | WebSocket: ${wsPing}ms`);
}

export const ping: Command<CommandInteraction> = {
  data,
  execute,
};
