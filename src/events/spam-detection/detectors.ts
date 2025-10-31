import type { Message } from "discord.js";
import { replaceSpoilerHack, stripCode } from "../../utils/messages.js";

export const containsLink = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  return withoutCode.includes("http://") || withoutCode.includes("https://");
};

export const containsBannedTag = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  return withoutCode.includes("@everyone") || withoutCode.includes("@here");
};

export const containsDiscordInvite = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  const keywords = ["discord.gg/", "discord.com/invite/", "discordapp.com/invite/"];
  return keywords.some((keyword) => withoutCode.includes(keyword));
};

export const containsSpoilerHack = (message: Message) => {
  const withoutCode = stripCode(message.content);

  return withoutCode !== replaceSpoilerHack(withoutCode, "");
};

export const isDuplicate = (message: Message, oldMessage: Message) => {
  return message.content.toLowerCase().trim() === oldMessage.content.toLowerCase().trim();
};

export const isCrossPost = (message: Message, oldMessage: Message) => {
  return isDuplicate(message, oldMessage) && message.channelId !== oldMessage.channelId;
};

export const anyMessage = () => true;
