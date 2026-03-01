import { Events } from "discord.js";
import cron from "node-cron";
import { processExpiredActions } from "../../utils/action-expiration.js";
import { createEvent } from "../helpers.js";

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Schedule weekly cron job to check for expired actions
    // Runs at midnight (00:00) every Sunday
    cron.schedule("0 0 * * 0", async () => {
      console.log("⏰ Running weekly expiration check...");
      try {
        await processExpiredActions(client);
      } catch (error) {
        console.error("Error during scheduled expiration check:", error);
      }
    });

    console.log("📅 Scheduled weekly action expiration check (Sundays at midnight)");
  }
);
