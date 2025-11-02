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

const logMessagesFormatters = {
  rule: (reason: string) => `**Rule Broken:** ${reason}`,
  user: (author: User) => `**User:** <@${author.id}>`,
  messagesInvolved: (messages: Message[], maxDisplay = 3) => {
    const displayedMessages = messages.slice(0, maxDisplay);
    const displayedCount = displayedMessages.length;
    const remainingCount = messages.length - displayedMessages.length;
    return (
      `**Message${displayedCount > 1 ? "s" : ""} Involved:**\n` +
      displayedMessages.map((msg) => `- "${msg.content}"`).join("\n") +
      (remainingCount > 0 ? `  ...and ${remainingCount} more` : "")
    );
  },
  channelsInvolved: (channels: Set<string>) => {
    const channelMentions = Array.from(channels).map((id) => `<#${id}>`);
    return `**Channel${channels.size > 1 ? "s" : ""} Involved:** ${channelMentions.join(", ")}`;
  },
  deletedAndMuted: (deletedCount: number, muteDuration?: number) => {
    return `**Messages Deleted:** ${deletedCount}  **Mute Duration:** ${
      muteDuration ? `${muteDuration / 1000} seconds` : "N/A"
    }`;
  },
};
export type LogFunction = (options: {
  messages: Message[];
  reason: string;
  deletedMessagesCount: number;
  muteDuration?: number;
  logChannel?: Channel;
}) => Promise<void>;

export const defaultLogFunction: LogFunction = async (options) => {
  if (!options.logChannel?.isSendable()) {
    return;
  }

  const content = `${logMessagesFormatters.rule(options.reason)}
${logMessagesFormatters.user(options.messages[0].author)}
${logMessagesFormatters.messagesInvolved(options.messages)}
${logMessagesFormatters.channelsInvolved(new Set(options.messages.map((message) => message.channelId)))}
${logMessagesFormatters.deletedAndMuted(options.deletedMessagesCount, options.muteDuration)}`;

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
