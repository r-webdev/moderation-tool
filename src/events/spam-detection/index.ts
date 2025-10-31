import { Events } from "discord.js";
import { cachedMessages } from "../../cache/message-cache.js";
import { config } from "../../env.js";
import { isNormalUserMessage } from "../../utils/messages.js";
import { createEvent } from "../helpers.js";
import { checkRules } from "./rules.js";

export const spamDetection = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (!isNormalUserMessage(message)) {
      return;
    }
    const regularRole = message.guild?.roles.cache.get(config.roles.regularId);
    if (regularRole === undefined || message.member === null) {
      return;
    }
    if (message.member.roles.highest.position >= regularRole.position) {
      return;
    }

    cachedMessages.add(message);
    await checkRules(message);
  }
);
