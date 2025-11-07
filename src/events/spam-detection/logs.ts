import {
  type Channel,
  ContainerBuilder,
  type Message,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type User,
} from "discord.js";
import { timeToString } from "../../utils/time.js";
import type { Rule } from "./rules-config.js";

const makeLogMessageTitleAndContent = (title: string, content: string) => {
  return `**${title}:** ${content}`;
};

const SPACER = `\n--------------------\n`;

export type LogFunctionOptions<T = Rule> = {
  messages: Message[];
  reason: string;
  deletedMessagesCount: number;
  muteDuration?: number;
  logChannel?: Channel;
  rule: T;
};
export type LogFunction<T = Rule> = (options: LogFunctionOptions<T>) => Promise<void>;

export const createLogTextContent = <T extends Rule>(options: LogFunctionOptions<T>) => {
  let contentString = "";

  contentString += `**Rule Broken:** ${options.reason}\n`;
  contentString += `**User:** <@${options.messages[0].author.id}>\n`;

  switch (options.rule.type) {
    case "contentBased": {
      const flaggedMessage = options.messages[0];
      contentString += makeLogMessageTitleAndContent(
        "Flagged Message",
        `\`\n\n${flaggedMessage.content}\`\n`
      );
      contentString += SPACER;
      contentString += makeLogMessageTitleAndContent("Channel", `<#${flaggedMessage.channelId}>`);
      break;
    }
    case "crossChannel": {
      if (options.rule.isBrokenBy.name === "isCrossPost") {
        contentString += `Posted in **${options.rule.channelCount}** channels within **${timeToString(options.rule.timeframe)} **\n`;
        const flaggedMessage = options.messages[0];
        const affectedChannels = new Set(options.messages.map((message) => message.channelId));
        contentString += makeLogMessageTitleAndContent(
          "Flagged Message",
          `\n\n${flaggedMessage.content}\n`
        );
        contentString += SPACER;
        contentString += makeLogMessageTitleAndContent(
          "Channels Involved",
          Array.from(affectedChannels)
            .map((id) => `<#${id}>`)
            .join(", ")
        );
      }
      break;
    }
    case "frequencyBased": {
      contentString += `Sent **${options.rule.frequency}** messages within **${timeToString(options.rule.timeframe)}**\n`;
      const displayedMessages = options.messages.slice(0, 5);
      const displayedCount = displayedMessages.length;
      const remainingCount = options.messages.length - displayedCount;

      contentString += `**Messages Involved:**\n`;
      contentString += displayedMessages
        .map((message) => {
          const contentPreview =
            message.content.length > 50 ? `${message.content.slice(0, 47)}...` : message.content;
          return `- ${contentPreview}`;
        })
        .join("\n");
      if (remainingCount > 0) {
        contentString += `\n  ...and ${remainingCount} more\n`;
      }
      break;
    }
  }

  contentString += SPACER;
  contentString += "**Action(s) Taken:**\n";
  if (options.deletedMessagesCount > 0) {
    contentString += `- Deleted ${options.deletedMessagesCount} message${options.deletedMessagesCount > 1 ? "s" : ""}\n`;
  }
  if (options.muteDuration) {
    contentString += `- Muted user for ${timeToString(options.muteDuration)}\n`;
  }

  return contentString;
};

export const defaultLogFunction: LogFunction = async (options) => {
  if (!options.logChannel?.isSendable()) {
    return;
  }

  const content = createLogTextContent(options);
  const textTextDisplayComponent = new TextDisplayBuilder().setContent(content);

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textTextDisplayComponent)
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(options.messages[0].author.displayAvatarURL())
    );

  const containerComponent = new ContainerBuilder()
    .addSectionComponents(sectionComponent)
    .setAccentColor(0xff0000);

  await options.logChannel.send({
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: undefined },
    components: [containerComponent],
  });
};
