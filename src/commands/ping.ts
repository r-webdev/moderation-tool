import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "./types.js";

const data = new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");

async function execute(interaction: CommandInteraction) {
  await interaction.reply("Pong!");
}

export const ping: Command = {
  data,
  execute,
};
