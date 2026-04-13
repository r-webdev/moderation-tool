import { Events } from "discord.js";
import { isDynoModerationMessage, isMessageInAPublicChannel } from "../../utils/messages.js";
import { createEvent } from "../helpers.js";

const DYNO_ID = "155149108183695360";

export const cleanModerationMessagesEvent = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    const isDynoMessage = message.author.bot && message.author.id === DYNO_ID;

    if (isDynoMessage && isMessageInAPublicChannel(message) && isDynoModerationMessage(message)) {
      try {
        await message.delete();
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  }
);
